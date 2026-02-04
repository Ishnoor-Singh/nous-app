import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new conversation
export const create = mutation({
  args: {
    userId: v.id("users"),
    topic: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId: args.userId,
      topic: args.topic,
      title: args.title,
      createdAt: now,
      lastMessageAt: now,
    });
  },
});

// Get recent conversations for a user
export const getRecent = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_user_recent", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);
  },
});

// Get a single conversation with messages
export const getWithMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return { conversation, messages };
  },
});

// Add a message to a conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      url: v.optional(v.string()),
      type: v.string(),
      mimeType: v.optional(v.string()),
      name: v.optional(v.string()),
      size: v.optional(v.number()),
    }))),
    emotionalContext: v.optional(v.object({
      valence: v.number(),
      arousal: v.number(),
      connection: v.number(),
      curiosity: v.number(),
      energy: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Update conversation's lastMessageAt
    await ctx.db.patch(args.conversationId, { lastMessageAt: now });

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

    // Create the message
    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      attachments,
      emotionalContext: args.emotionalContext,
      createdAt: now,
    });
  },
});

// Update conversation title (auto-generated from first exchange)
export const updateTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, { title: args.title });
  },
});
