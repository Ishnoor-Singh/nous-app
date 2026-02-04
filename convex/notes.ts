import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all notes for a user (most recent first)
export const getNotes = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    // Filter archived unless explicitly requested
    if (!args.includeArchived) {
      notes = notes.filter((n) => !n.isArchived);
    }
    
    // Apply limit
    if (args.limit) {
      notes = notes.slice(0, args.limit);
    }
    
    return notes;
  },
});

// Get pinned notes
export const getPinnedNotes = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    return notes.filter((n) => n.isPinned && !n.isArchived);
  },
});

// Get a single note
export const getNote = query({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.noteId);
  },
});

// Search notes
export const searchNotes = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    // Use search index for content
    const results = await ctx.db
      .query("notes")
      .withSearchIndex("search_notes", (q) =>
        q.search("content", args.query).eq("userId", args.userId)
      )
      .take(20);
    
    return results;
  },
});

// Get notes by tag
export const getNotesByTag = query({
  args: {
    userId: v.id("users"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    return notes.filter(
      (n) => n.tags?.includes(args.tag) && !n.isArchived
    );
  },
});

// Get all unique tags for a user
export const getTags = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const tagCounts = new Map<string, number>();
    for (const note of notes) {
      if (note.tags && !note.isArchived) {
        for (const tag of note.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }
    
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },
});

// Create a new note
export const createNote = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    source: v.optional(v.union(
      v.literal("chat"),
      v.literal("manual"),
      v.literal("video"),
      v.literal("article"),
      v.literal("highlight"),
      v.literal("journal"),
      v.literal("capture"),
      v.literal("import"),
    )),
    sourceUrl: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    attachments: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      url: v.optional(v.string()),
      type: v.string(),
      mimeType: v.optional(v.string()),
      name: v.optional(v.string()),
      size: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Resolve attachment URLs if needed
    let attachments = args.attachments;
    if (attachments) {
      attachments = await Promise.all(
        attachments.map(async (att) => {
          if (!att.url) {
            const url = await ctx.storage.getUrl(att.storageId);
            return { ...att, url: url || undefined };
          }
          return att;
        })
      );
    }
    
    return await ctx.db.insert("notes", {
      userId: args.userId,
      title: args.title,
      content: args.content,
      tags: args.tags,
      source: args.source || "manual",
      sourceUrl: args.sourceUrl,
      sourceId: args.sourceId,
      attachments,
      isPinned: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a note
export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    attachments: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      url: v.optional(v.string()),
      type: v.string(),
      mimeType: v.optional(v.string()),
      name: v.optional(v.string()),
      size: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.tags !== undefined) updates.tags = args.tags;
    
    // Resolve attachment URLs if needed
    if (args.attachments !== undefined) {
      const attachments = await Promise.all(
        args.attachments.map(async (att) => {
          if (!att.url) {
            const url = await ctx.storage.getUrl(att.storageId);
            return { ...att, url: url || undefined };
          }
          return att;
        })
      );
      updates.attachments = attachments;
    }
    
    await ctx.db.patch(args.noteId, updates);
    return args.noteId;
  },
});

// Pin/unpin a note
export const togglePinNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) throw new Error("Note not found");
    
    await ctx.db.patch(args.noteId, {
      isPinned: !note.isPinned,
      updatedAt: Date.now(),
    });
    
    return !note.isPinned;
  },
});

// Archive a note
export const archiveNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      isArchived: true,
      isPinned: false, // Unpin when archiving
      updatedAt: Date.now(),
    });
    return args.noteId;
  },
});

// Restore a note from archive
export const restoreNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      isArchived: false,
      updatedAt: Date.now(),
    });
    return args.noteId;
  },
});

// Delete a note permanently
export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.noteId);
    return args.noteId;
  },
});

// Get notes tree for sidebar (hierarchical structure)
export const getNotesTree = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter out archived and return minimal data for tree
    return notes
      .filter((n) => !n.isArchived)
      .map((n) => ({
        _id: n._id,
        title: n.title,
        icon: n.icon,
        parentId: n.parentId,
        isPinned: n.isPinned,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// Get child notes
export const getChildNotes = query({
  args: {
    parentId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const children = await ctx.db
      .query("notes")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
    
    return children.filter((n) => !n.isArchived);
  },
});

// Update note blocks (from tiptap editor)
export const updateNoteBlocks = mutation({
  args: {
    noteId: v.id("notes"),
    blocks: v.any(), // Tiptap JSON document
    content: v.string(), // Plain text for search
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      blocks: args.blocks,
      content: args.content,
      updatedAt: Date.now(),
    });
    return args.noteId;
  },
});

// Update note metadata (title, icon, etc)
export const updateNoteMeta = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    icon: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    parentId: v.optional(v.id("notes")),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    
    if (args.title !== undefined) updates.title = args.title;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.parentId !== undefined) updates.parentId = args.parentId;
    
    await ctx.db.patch(args.noteId, updates);
    return args.noteId;
  },
});

// Find note by title (for backlinks)
export const findNoteByTitle = query({
  args: {
    userId: v.id("users"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Case-insensitive match
    const titleLower = args.title.toLowerCase();
    return notes.find(
      (n) => n.title.toLowerCase() === titleLower && !n.isArchived
    );
  },
});

// Update backlinks for a note
export const updateBacklinks = mutation({
  args: {
    noteId: v.id("notes"),
    outgoingLinks: v.array(v.id("notes")),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) throw new Error("Note not found");
    
    // Get previous outgoing links
    const previousLinks = note.outgoingLinks || [];
    
    // Remove this note from backlinks of notes no longer linked
    for (const linkedId of previousLinks) {
      if (!args.outgoingLinks.includes(linkedId)) {
        const linkedNote = await ctx.db.get(linkedId);
        if (linkedNote && linkedNote.backlinks) {
          const newBacklinks = linkedNote.backlinks.filter((id) => id !== args.noteId);
          await ctx.db.patch(linkedId, { backlinks: newBacklinks });
        }
      }
    }
    
    // Add this note to backlinks of newly linked notes
    for (const linkedId of args.outgoingLinks) {
      if (!previousLinks.includes(linkedId)) {
        const linkedNote = await ctx.db.get(linkedId);
        if (linkedNote) {
          const currentBacklinks = linkedNote.backlinks || [];
          if (!currentBacklinks.includes(args.noteId)) {
            await ctx.db.patch(linkedId, {
              backlinks: [...currentBacklinks, args.noteId],
            });
          }
        }
      }
    }
    
    // Update outgoing links on this note
    await ctx.db.patch(args.noteId, {
      outgoingLinks: args.outgoingLinks,
      updatedAt: Date.now(),
    });
    
    return args.noteId;
  },
});

// Get backlinks for a note (with titles)
export const getBacklinks = query({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) return [];
    
    const backlinks = note.backlinks || [];
    const linkedNotes = await Promise.all(
      backlinks.map(async (id) => {
        const linkedNote = await ctx.db.get(id);
        if (!linkedNote || linkedNote.isArchived) return null;
        return {
          _id: linkedNote._id,
          title: linkedNote.title,
          icon: linkedNote.icon,
        };
      })
    );
    
    return linkedNotes.filter(Boolean);
  },
});

// Create note with initial blocks
export const createNoteWithBlocks = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    blocks: v.optional(v.any()),
    content: v.optional(v.string()),
    parentId: v.optional(v.id("notes")),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("notes", {
      userId: args.userId,
      title: args.title,
      content: args.content || "",
      blocks: args.blocks,
      parentId: args.parentId,
      icon: args.icon,
      source: "manual",
      isPinned: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});
