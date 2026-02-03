import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user from Clerk webhook
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });

    // Initialize emotional state for new user
    await ctx.db.insert("emotionalState", {
      userId,
      valence: 0.2, // slightly positive
      arousal: 0.3, // calm but alert
      connection: 0.1, // just meeting
      curiosity: 0.6, // eager to learn about them
      energy: 0.5, // neutral
      baselineValence: 0.1,
      baselineArousal: 0.3,
      baselineConnection: 0.3,
      baselineCuriosity: 0.5,
      baselineEnergy: 0.5,
      recentEmotions: [{
        label: "curiosity",
        intensity: 0.7,
        trigger: "meeting a new person",
        timestamp: Date.now(),
      }],
      lastUpdated: Date.now(),
    });

    // Initialize learning progress
    await ctx.db.insert("learningProgress", {
      userId,
      topicInterests: {
        philosophy: 0.5,
        history: 0.5,
        economics: 0.5,
        art: 0.5,
        psychology: 0.5,
      },
      struggles: [],
      mastered: [],
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDay: "",
      totalCardsCompleted: 0,
    });

    return userId;
  },
});

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getUserWithState = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return null;

    const emotionalState = await ctx.db
      .query("emotionalState")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const learningProgress = await ctx.db
      .query("learningProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return { user, emotionalState, learningProgress };
  },
});
