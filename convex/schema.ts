import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // AI's emotional state per user
  emotionalState: defineTable({
    userId: v.id("users"),
    // Core dimensions (-1 to 1 for valence, 0 to 1 for others)
    valence: v.number(), // negative to positive mood
    arousal: v.number(), // calm to excited
    connection: v.number(), // distant to bonded
    curiosity: v.number(), // bored to fascinated
    energy: v.number(), // depleted to energized
    // Baseline (what we drift toward)
    baselineValence: v.number(),
    baselineArousal: v.number(),
    baselineConnection: v.number(),
    baselineCuriosity: v.number(),
    baselineEnergy: v.number(),
    // Recent emotions for context
    recentEmotions: v.array(v.object({
      label: v.string(),
      intensity: v.number(),
      trigger: v.string(),
      timestamp: v.number(),
    })),
    lastUpdated: v.number(),
  }).index("by_user", ["userId"]),

  // Conversations
  conversations: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    topic: v.optional(v.string()), // philosophy, history, economics, art, psychology
    createdAt: v.number(),
    lastMessageAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_recent", ["userId", "lastMessageAt"]),

  // Messages in conversations
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    // For AI messages: what emotional state influenced this response
    emotionalContext: v.optional(v.object({
      valence: v.number(),
      arousal: v.number(),
      connection: v.number(),
      curiosity: v.number(),
      energy: v.number(),
    })),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  // Knowledge cards - daily discoveries
  knowledgeCards: defineTable({
    userId: v.id("users"),
    topic: v.string(), // philosophy, history, economics, art, psychology
    title: v.string(),
    summary: v.string(),
    depth: v.number(), // 1-5 how deep they went
    completed: v.boolean(),
    dayGenerated: v.string(), // YYYY-MM-DD
    createdAt: v.number(),
  })
    .index("by_user_day", ["userId", "dayGenerated"])
    .index("by_user", ["userId"]),

  // Learning progress - what the AI has learned about the user
  learningProgress: defineTable({
    userId: v.id("users"),
    // Topics they're interested in
    topicInterests: v.object({
      philosophy: v.number(),
      history: v.number(),
      economics: v.number(),
      art: v.number(),
      psychology: v.number(),
    }),
    // What they struggle with
    struggles: v.array(v.object({
      topic: v.string(),
      concept: v.string(),
      notedAt: v.number(),
    })),
    // What they've mastered
    mastered: v.array(v.object({
      topic: v.string(),
      concept: v.string(),
      masteredAt: v.number(),
    })),
    // Learning style preferences
    preferredStyle: v.optional(v.union(
      v.literal("socratic"), // questions
      v.literal("narrative"), // stories
      v.literal("analytical"), // logic
      v.literal("visual"), // diagrams/examples
    )),
    // Streak data
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActiveDay: v.string(),
    totalCardsCompleted: v.number(),
  }).index("by_user", ["userId"]),

  // Self-improvement learnings
  aiLearnings: defineTable({
    userId: v.id("users"),
    category: v.union(
      v.literal("correction"),
      v.literal("knowledge_gap"),
      v.literal("best_practice"),
      v.literal("user_preference"),
    ),
    summary: v.string(),
    details: v.string(),
    createdAt: v.number(),
    appliedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // Habits - customizable daily habits (75 Hard style)
  habits: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // emoji
    category: v.union(
      v.literal("fitness"),
      v.literal("nutrition"),
      v.literal("mindfulness"),
      v.literal("learning"),
      v.literal("productivity"),
      v.literal("health"),
      v.literal("custom"),
    ),
    // Tracking config
    trackingType: v.union(
      v.literal("boolean"), // did/didn't
      v.literal("count"), // e.g., glasses of water
      v.literal("duration"), // minutes
    ),
    targetValue: v.optional(v.number()), // e.g., 8 glasses, 45 minutes
    targetUnit: v.optional(v.string()), // e.g., "glasses", "minutes"
    // Schedule
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("custom"),
    ),
    activeDays: v.optional(v.array(v.number())), // 0-6 for custom
    // State
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Daily habit completions
  habitLogs: defineTable({
    userId: v.id("users"),
    habitId: v.id("habits"),
    date: v.string(), // YYYY-MM-DD
    completed: v.boolean(),
    value: v.optional(v.number()), // for count/duration types
    notes: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  })
    .index("by_habit_date", ["habitId", "date"])
    .index("by_user_date", ["userId", "date"]),

  // Todos with Nous accountability
  todos: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    ),
    dueDate: v.optional(v.string()), // YYYY-MM-DD
    dueTime: v.optional(v.string()), // HH:MM
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    // Nous accountability
    nousReminder: v.optional(v.boolean()), // should Nous check in about this?
    reminderSent: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_due", ["userId", "dueDate"]),

  // Daily check-in summaries
  dailyCheckIns: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    // Mood tracking
    morningMood: v.optional(v.number()), // 1-5
    eveningMood: v.optional(v.number()),
    // Quick reflections
    gratitude: v.optional(v.string()),
    intention: v.optional(v.string()),
    reflection: v.optional(v.string()),
    // Aggregate stats for the day
    habitsCompleted: v.number(),
    habitsTotal: v.number(),
    todosCompleted: v.number(),
    // Nous's summary/encouragement
    nousSummary: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_date", ["userId", "date"]),
});
