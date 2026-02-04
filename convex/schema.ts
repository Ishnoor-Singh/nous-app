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
      v.literal("correction"),      // User corrected the AI
      v.literal("preference"),      // User preference discovered  
      v.literal("knowledge_gap"),   // AI didn't know something
      v.literal("teaching_style"),  // What teaching approach works
      v.literal("interest"),        // Topics user is interested in
      v.literal("context"),         // Important user context
      v.literal("feedback"),        // Explicit feedback from user
      v.literal("best_practice"),   // Legacy - best practices learned
      v.literal("user_preference"), // Legacy - keeping for compatibility
    ),
    summary: v.string(),
    details: v.string(),
    confidence: v.optional(v.number()), // 0-1 confidence in this learning
    source: v.optional(v.string()),     // What triggered this learning
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
    // Project & context (GTD-style)
    projectId: v.optional(v.id("projects")),
    context: v.optional(v.union(
      v.literal("home"),
      v.literal("work"),
      v.literal("errands"),
      v.literal("phone"),
      v.literal("computer"),
      v.literal("anywhere"),
    )),
    // Time estimates
    estimatedMinutes: v.optional(v.number()),
    actualMinutes: v.optional(v.number()),
    // Dependencies - blocked by other tasks
    blockedBy: v.optional(v.array(v.id("todos"))),
    // Recurrence
    isRecurring: v.optional(v.boolean()),
    recurrence: v.optional(v.object({
      pattern: v.union(
        v.literal("daily"),
        v.literal("weekdays"),
        v.literal("weekly"),
        v.literal("biweekly"),
        v.literal("monthly"),
      ),
      interval: v.optional(v.number()), // every N periods
      daysOfWeek: v.optional(v.array(v.number())), // 0-6 for weekly
      dayOfMonth: v.optional(v.number()), // 1-31 for monthly
      endDate: v.optional(v.string()), // When to stop recurring
    })),
    parentTaskId: v.optional(v.id("todos")), // For recurring: link to template
    // Nous accountability
    nousReminder: v.optional(v.boolean()), // should Nous check in about this?
    reminderSent: v.optional(v.boolean()),
    // Energy level (for smart scheduling)
    energyRequired: v.optional(v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    )),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_due", ["userId", "dueDate"])
    .index("by_project", ["projectId"]),

  // Journal entries with AI assistance
  journalEntries: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    // Entry content
    prompt: v.optional(v.string()), // AI prompt that started this
    content: v.string(), // User's journal entry
    // AI analysis
    mood: v.optional(v.string()), // detected mood
    themes: v.optional(v.array(v.string())), // extracted themes
    aiReflection: v.optional(v.string()), // Nous's thoughtful response
    // Metadata
    wordCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // Saved media (YouTube, articles, podcasts, etc.)
  savedMedia: defineTable({
    userId: v.id("users"),
    // Source info
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
    duration: v.optional(v.string()), // for videos/podcasts
    // AI-generated content
    summary: v.optional(v.string()), // AI summary
    keyPoints: v.optional(v.array(v.string())), // bullet points
    transcript: v.optional(v.string()), // full transcript if available
    notes: v.optional(v.string()), // AI-generated notes
    // User additions
    userNotes: v.optional(v.string()),
    highlights: v.optional(v.array(v.object({
      text: v.string(),
      note: v.optional(v.string()),
      timestamp: v.optional(v.string()), // for video timestamps
    }))),
    // Organization
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    // Reading/watch status
    status: v.union(
      v.literal("inbox"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("archived"),
    ),
    // Metadata
    savedAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .searchIndex("search_content", {
      searchField: "title",
      filterFields: ["userId", "type", "status"],
    }),

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

  // Projects - group related tasks
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()), // hex color
    icon: v.optional(v.string()), // emoji
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived"),
    ),
    // Progress tracking
    totalTasks: v.number(),
    completedTasks: v.number(),
    // Dates
    dueDate: v.optional(v.string()), // YYYY-MM-DD
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  // Quick capture inbox - unprocessed thoughts/tasks
  quickCapture: defineTable({
    userId: v.id("users"),
    content: v.string(), // Raw text input
    // AI-parsed interpretation
    parsedType: v.optional(v.union(
      v.literal("task"),
      v.literal("note"),
      v.literal("reminder"),
      v.literal("idea"),
      v.literal("unknown"),
    )),
    parsedData: v.optional(v.object({
      title: v.optional(v.string()),
      dueDate: v.optional(v.string()),
      dueTime: v.optional(v.string()),
      priority: v.optional(v.string()),
      context: v.optional(v.string()),
      project: v.optional(v.string()),
    })),
    // Processing status
    status: v.union(
      v.literal("pending"),
      v.literal("processed"),
      v.literal("dismissed"),
    ),
    processedAs: v.optional(v.union(
      v.literal("todo"),
      v.literal("journal"),
      v.literal("note"),
      v.literal("dismissed"),
    )),
    linkedId: v.optional(v.string()), // ID of created todo/note
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  // Notes - personal knowledge base (Me-bot style)
  notes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    // Organization
    tags: v.optional(v.array(v.string())),
    source: v.optional(v.union(
      v.literal("chat"),      // Created via AI conversation
      v.literal("manual"),    // User typed directly
      v.literal("video"),     // From video summary
      v.literal("article"),   // From article
      v.literal("highlight"), // From highlight
      v.literal("journal"),   // From journal entry
      v.literal("capture"),   // From quick capture
      v.literal("import"),    // Imported from elsewhere
    )),
    sourceUrl: v.optional(v.string()), // If from external source
    sourceId: v.optional(v.string()),  // If linked to savedMedia etc
    // AI enrichment
    summary: v.optional(v.string()),   // AI-generated summary
    relatedTopics: v.optional(v.array(v.string())), // AI-detected topics
    // Status
    isPinned: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_pinned", ["userId", "isPinned"])
    .index("by_user_archived", ["userId", "isArchived"])
    .searchIndex("search_notes", {
      searchField: "content",
      filterFields: ["userId"],
    }),
});
