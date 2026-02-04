import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ===== AI MEMORY SYSTEM =====
// This implements OpenClaw-style self-evolution where the AI learns and remembers

// Store a new learning
export const addLearning = mutation({
  args: {
    userId: v.id("users"),
    category: v.union(
      v.literal("correction"),      // User corrected the AI
      v.literal("preference"),      // User preference discovered
      v.literal("knowledge_gap"),   // AI didn't know something
      v.literal("teaching_style"),  // What teaching approach works
      v.literal("interest"),        // Topics user is interested in
      v.literal("context"),         // Important user context
      v.literal("feedback"),        // Explicit feedback from user
      v.literal("best_practice"),   // Legacy
      v.literal("user_preference"), // Legacy
    ),
    summary: v.string(),           // Short summary (shown to AI)
    details: v.string(),           // Full details
    confidence: v.optional(v.number()),  // 0-1 confidence in this learning
    source: v.optional(v.string()), // What triggered this learning
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiLearnings", {
      userId: args.userId,
      category: args.category,
      summary: args.summary,
      details: args.details,
      confidence: args.confidence,
      source: args.source,
      createdAt: Date.now(),
      appliedAt: undefined,
    });
  },
});

// Get relevant learnings for context (used before generating responses)
export const getRelevantLearnings = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const learnings = await ctx.db
      .query("aiLearnings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);

    // Group by category for structured retrieval
    const grouped = {
      corrections: learnings.filter((l) => l.category === "correction"),
      preferences: learnings.filter((l) => l.category === "user_preference"),
      context: learnings.filter((l) => 
        l.category === "knowledge_gap" || 
        l.category === "best_practice"
      ),
    };

    return {
      all: learnings,
      grouped,
      summary: learnings.slice(0, 5).map((l) => l.summary).join("; "),
    };
  },
});

// Get learnings as context string for the AI
export const getMemoryContext = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const learnings = await ctx.db
      .query("aiLearnings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(15);

    if (learnings.length === 0) return null;

    // Build memory context string
    const sections: string[] = [];

    const corrections = learnings.filter((l) => l.category === "correction");
    if (corrections.length > 0) {
      sections.push(
        "CORRECTIONS (things user has corrected you on):\n" +
        corrections.slice(0, 3).map((c) => `- ${c.summary}`).join("\n")
      );
    }

    const preferences = learnings.filter((l) => l.category === "user_preference");
    if (preferences.length > 0) {
      sections.push(
        "USER PREFERENCES:\n" +
        preferences.slice(0, 5).map((p) => `- ${p.summary}`).join("\n")
      );
    }

    const otherLearnings = learnings.filter(
      (l) => l.category !== "correction" && l.category !== "user_preference"
    );
    if (otherLearnings.length > 0) {
      sections.push(
        "OTHER LEARNINGS:\n" +
        otherLearnings.slice(0, 5).map((l) => `- ${l.summary}`).join("\n")
      );
    }

    return sections.join("\n\n");
  },
});

// Mark a learning as applied (track when AI uses its memory)
export const markApplied = mutation({
  args: { learningId: v.id("aiLearnings") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.learningId, { appliedAt: Date.now() });
  },
});

// ===== USER PROFILE EVOLUTION =====
// Track how the AI's understanding of the user evolves

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get learning progress for topics
    const learningProgress = await ctx.db
      .query("learningProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Get recent emotions for mood patterns
    const emotionalState = await ctx.db
      .query("emotionalState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Get recent journal entries for context
    const recentJournals = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(3);

    // Get habit completion rate
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      topicInterests: learningProgress?.topicInterests,
      preferredStyle: learningProgress?.preferredStyle,
      currentStreak: learningProgress?.currentStreak || 0,
      connectionLevel: emotionalState?.connection || 0,
      recentMoods: emotionalState?.recentEmotions?.slice(0, 3),
      recentJournalThemes: recentJournals.flatMap((j) => j.themes || []),
      activeHabitsCount: habits.filter((h) => h.isActive).length,
    };
  },
});

// ===== CONVERSATION ANALYSIS =====
// Detect learnable moments from conversations

export const analyzeForLearnings = mutation({
  args: {
    userId: v.id("users"),
    userMessage: v.string(),
    aiResponse: v.string(),
    wasHelpful: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const detectedLearnings: Array<{
      category: "correction" | "preference" | "knowledge_gap" | "teaching_style" | "interest" | "context" | "feedback" | "best_practice" | "user_preference";
      summary: string;
      details: string;
      confidence: number;
    }> = [];

    const lowerMessage = args.userMessage.toLowerCase();

    // Detect corrections
    const correctionPhrases = [
      "no, ", "not quite", "actually,", "that's wrong", "incorrect",
      "you're wrong", "that's not right", "i meant", "no i meant",
      "wrong", "that's incorrect",
    ];
    if (correctionPhrases.some((p) => lowerMessage.includes(p))) {
      detectedLearnings.push({
        category: "correction",
        summary: `User corrected: "${args.userMessage.slice(0, 100)}"`,
        details: `User message: ${args.userMessage}\nAI response was: ${args.aiResponse}`,
        confidence: 0.8,
      });
    }

    // Detect explicit preferences
    const preferencePhrases = [
      "i prefer", "i like when", "i don't like when", "please don't", 
      "can you please", "i want you to", "i'd rather you", "i always want",
      "never do", "always do", "don't ever",
    ];
    if (preferencePhrases.some((p) => lowerMessage.includes(p))) {
      detectedLearnings.push({
        category: "preference",
        summary: `Preference: "${args.userMessage.slice(0, 100)}"`,
        details: args.userMessage,
        confidence: 0.7,
      });
    }

    // Detect interests
    const interestPhrases = [
      "i'm interested in", "i love", "i'm fascinated by", "tell me more about",
      "i'm curious about", "i've always wanted to learn",
    ];
    if (interestPhrases.some((p) => lowerMessage.includes(p))) {
      detectedLearnings.push({
        category: "interest",
        summary: `Interest: "${args.userMessage.slice(0, 100)}"`,
        details: args.userMessage,
        confidence: 0.6,
      });
    }

    // Detect negative feedback
    if (args.wasHelpful === false) {
      detectedLearnings.push({
        category: "feedback",
        summary: `Response not helpful for: "${args.userMessage.slice(0, 50)}"`,
        details: `User didn't find this helpful. Message: ${args.userMessage}`,
        confidence: 0.9,
      });
    }

    // Detect personal context sharing
    const contextPhrases = [
      "i work as", "i'm a ", "my job is", "i live in", "i have a ",
      "i'm from", "i studied", "my background is",
    ];
    if (contextPhrases.some((p) => lowerMessage.includes(p))) {
      detectedLearnings.push({
        category: "context",
        summary: `Context: "${args.userMessage.slice(0, 100)}"`,
        details: args.userMessage,
        confidence: 0.7,
      });
    }

    // Store detected learnings
    for (const learning of detectedLearnings) {
      await ctx.db.insert("aiLearnings", {
        userId: args.userId,
        category: learning.category,
        summary: learning.summary,
        details: learning.details,
        confidence: learning.confidence,
        source: "conversation_analysis",
        createdAt: Date.now(),
      });
    }

    return detectedLearnings.length;
  },
});
