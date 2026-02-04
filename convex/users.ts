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

// Get user by email (for bot API identification)
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Note: This scans all users - for production, add an index on email
    const users = await ctx.db.query("users").collect();
    return users.find(u => u.email.toLowerCase() === args.email.toLowerCase()) || null;
  },
});

// Get user by phone number (for WhatsApp/SMS bot)
export const getUserByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    // Normalize phone (remove spaces, dashes)
    const normalizedPhone = args.phone.replace(/[\s-]/g, "");
    // For now, we'd need to add phone to the user schema
    // This is a placeholder for future implementation
    return null;
  },
});

// Save onboarding preferences
export const completeOnboarding = mutation({
  args: {
    userId: v.id("users"),
    preferredName: v.string(),
    interests: v.array(v.string()),
    learningStyle: v.union(
      v.literal("socratic"),
      v.literal("narrative"),
      v.literal("analytical"),
      v.literal("visual")
    ),
  },
  handler: async (ctx, args) => {
    // Update user name if provided
    await ctx.db.patch(args.userId, {
      name: args.preferredName,
    });

    // Update learning progress with preferences
    const progress = await ctx.db
      .query("learningProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (progress) {
      // Convert interests array to weighted topic interests
      const topicInterests = {
        philosophy: args.interests.includes("philosophy") ? 0.8 : 0.3,
        history: args.interests.includes("history") ? 0.8 : 0.3,
        economics: args.interests.includes("economics") ? 0.8 : 0.3,
        art: args.interests.includes("art") ? 0.8 : 0.3,
        psychology: args.interests.includes("psychology") ? 0.8 : 0.3,
      };

      await ctx.db.patch(progress._id, {
        preferredStyle: args.learningStyle,
        topicInterests,
      });
    }

    return { success: true };
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

// Reset all user data (conversations, habits, todos, notes, etc.)
export const resetAccount = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = args.userId;
    
    // Delete all conversations and messages
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_recent", (q) => q.eq("userId", userId))
      .collect();
    
    for (const conv of conversations) {
      // Delete messages in conversation
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      await ctx.db.delete(conv._id);
    }

    // Delete habits and habit logs
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const habit of habits) {
      const logs = await ctx.db
        .query("habitLogs")
        .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
        .collect();
      for (const log of logs) {
        await ctx.db.delete(log._id);
      }
      await ctx.db.delete(habit._id);
    }

    // Delete todos
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const todo of todos) {
      await ctx.db.delete(todo._id);
    }

    // Delete projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const project of projects) {
      await ctx.db.delete(project._id);
    }

    // Delete notes
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    // Delete journal entries
    const journals = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const journal of journals) {
      await ctx.db.delete(journal._id);
    }

    // Delete AI learnings
    const learnings = await ctx.db
      .query("aiLearnings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const learning of learnings) {
      await ctx.db.delete(learning._id);
    }

    // Delete quick captures
    const captures = await ctx.db
      .query("quickCapture")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const capture of captures) {
      await ctx.db.delete(capture._id);
    }

    // Delete media items
    const media = await ctx.db
      .query("media")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const item of media) {
      await ctx.db.delete(item._id);
    }

    // Reset emotional state
    const emotionalState = await ctx.db
      .query("emotionalState")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (emotionalState) {
      await ctx.db.patch(emotionalState._id, {
        valence: 0.2,
        arousal: 0.3,
        connection: 0.1,
        curiosity: 0.6,
        energy: 0.5,
        recentEmotions: [],
        lastUpdated: Date.now(),
      });
    }

    // Reset learning progress
    const learningProgress = await ctx.db
      .query("learningProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (learningProgress) {
      await ctx.db.patch(learningProgress._id, {
        currentStreak: 0,
        totalCardsCompleted: 0,
        struggles: [],
        mastered: [],
      });
    }

    return { success: true };
  },
});
