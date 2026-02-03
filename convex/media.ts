import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all saved media for a user
export const getMedia = query({
  args: { 
    userId: v.id("users"),
    status: v.optional(v.union(
      v.literal("inbox"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("archived"),
    )),
    type: v.optional(v.union(
      v.literal("youtube"),
      v.literal("article"),
      v.literal("podcast"),
      v.literal("tweet"),
      v.literal("book"),
      v.literal("other"),
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("savedMedia")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    const results = await query.order("desc").take(args.limit || 50);
    
    // Filter in memory for now (could optimize with compound index)
    return results.filter(item => {
      if (args.status && item.status !== args.status) return false;
      if (args.type && item.type !== args.type) return false;
      return true;
    });
  },
});

// Get a single media item
export const getMediaItem = query({
  args: { mediaId: v.id("savedMedia") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mediaId);
  },
});

// Save new media
export const saveMedia = mutation({
  args: {
    userId: v.id("users"),
    url: v.string(),
    type: v.union(
      v.literal("youtube"),
      v.literal("article"),
      v.literal("podcast"),
      v.literal("tweet"),
      v.literal("book"),
      v.literal("other"),
    ),
    title: v.string(),
    author: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if URL already saved
    const existing = await ctx.db
      .query("savedMedia")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("url"), args.url))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("savedMedia", {
      ...args,
      status: "inbox",
      savedAt: Date.now(),
    });
  },
});

// Update media with AI-generated content
export const updateMediaContent = mutation({
  args: {
    mediaId: v.id("savedMedia"),
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
    transcript: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("inbox"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("archived"),
    )),
  },
  handler: async (ctx, args) => {
    const { mediaId, ...updates } = args;
    
    await ctx.db.patch(mediaId, {
      ...updates,
      processedAt: Date.now(),
    });
  },
});

// Add user notes/highlights
export const addHighlight = mutation({
  args: {
    mediaId: v.id("savedMedia"),
    text: v.string(),
    note: v.optional(v.string()),
    timestamp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.mediaId);
    if (!media) throw new Error("Media not found");

    const highlights = media.highlights || [];
    highlights.push({
      text: args.text,
      note: args.note,
      timestamp: args.timestamp,
    });

    await ctx.db.patch(args.mediaId, { highlights });
  },
});

// Update user notes
export const updateUserNotes = mutation({
  args: {
    mediaId: v.id("savedMedia"),
    userNotes: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mediaId, { userNotes: args.userNotes });
  },
});

// Update tags
export const updateTags = mutation({
  args: {
    mediaId: v.id("savedMedia"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mediaId, { tags: args.tags });
  },
});

// Archive media
export const archiveMedia = mutation({
  args: { mediaId: v.id("savedMedia") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mediaId, { status: "archived" });
  },
});

// Delete media
export const deleteMedia = mutation({
  args: { mediaId: v.id("savedMedia") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.mediaId);
  },
});

// Get media stats
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("savedMedia")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const byType = {
      youtube: 0,
      article: 0,
      podcast: 0,
      tweet: 0,
      book: 0,
      other: 0,
    };

    const byStatus = {
      inbox: 0,
      processing: 0,
      ready: 0,
      archived: 0,
    };

    for (const item of media) {
      byType[item.type]++;
      byStatus[item.status]++;
    }

    return {
      total: media.length,
      byType,
      byStatus,
    };
  },
});

// Get all unique tags
export const getTags = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("savedMedia")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const tagCounts = new Map<string, number>();
    for (const item of media) {
      for (const tag of item.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  },
});
