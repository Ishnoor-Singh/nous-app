import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("notes", {
      userId: args.userId,
      title: args.title,
      content: args.content,
      tags: args.tags,
      source: args.source || "manual",
      sourceUrl: args.sourceUrl,
      sourceId: args.sourceId,
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
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.tags !== undefined) updates.tags = args.tags;
    
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
