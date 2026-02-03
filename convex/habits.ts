import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all habits for a user
export const getHabits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get today's habit status
export const getTodayProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", today)
      )
      .collect();

    const logMap = new Map(logs.map(l => [l.habitId, l]));

    return habits.map(habit => ({
      ...habit,
      todayLog: logMap.get(habit._id) || null,
      isCompletedToday: logMap.get(habit._id)?.completed || false,
    }));
  },
});

// Get habit streaks
export const getStreaks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const streaks = [];
    
    for (const habit of habits) {
      // Get last 30 days of logs
      const logs = await ctx.db
        .query("habitLogs")
        .withIndex("by_habit_date", (q) => q.eq("habitId", habit._id))
        .order("desc")
        .take(30);

      // Calculate current streak
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        
        const log = logs.find(l => l.date === dateStr);
        if (log?.completed) {
          streak++;
        } else if (i > 0) { // Allow today to be incomplete
          break;
        }
      }

      streaks.push({
        habitId: habit._id,
        name: habit.name,
        icon: habit.icon,
        currentStreak: streak,
      });
    }

    return streaks;
  },
});

// Create a new habit
export const createHabit = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    category: v.union(
      v.literal("fitness"),
      v.literal("nutrition"),
      v.literal("mindfulness"),
      v.literal("learning"),
      v.literal("productivity"),
      v.literal("health"),
      v.literal("custom"),
    ),
    trackingType: v.union(
      v.literal("boolean"),
      v.literal("count"),
      v.literal("duration"),
    ),
    targetValue: v.optional(v.number()),
    targetUnit: v.optional(v.string()),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("custom"),
    ),
    activeDays: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("habits", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Log habit completion
export const logHabit = mutation({
  args: {
    userId: v.id("users"),
    habitId: v.id("habits"),
    date: v.optional(v.string()),
    completed: v.boolean(),
    value: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = args.date || new Date().toISOString().split("T")[0];
    
    // Check if log exists for this date
    const existing = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) => 
        q.eq("habitId", args.habitId).eq("date", date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: args.completed,
        value: args.value,
        notes: args.notes,
        completedAt: args.completed ? Date.now() : undefined,
      });
      return existing._id;
    }

    return await ctx.db.insert("habitLogs", {
      userId: args.userId,
      habitId: args.habitId,
      date,
      completed: args.completed,
      value: args.value,
      notes: args.notes,
      completedAt: args.completed ? Date.now() : undefined,
    });
  },
});

// Delete a habit
export const deleteHabit = mutation({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.habitId, { isActive: false });
  },
});

// Get summary for AI context
export const getSummaryForAI = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", today)
      )
      .collect();

    const logMap = new Map(logs.map(l => [l.habitId.toString(), l]));
    
    const completedToday = habits.filter(h => logMap.get(h._id.toString())?.completed).length;
    
    return {
      total: habits.length,
      completedToday,
      remaining: habits.length - completedToday,
      items: habits.map(h => ({
        id: h._id,
        name: h.name,
        icon: h.icon,
        category: h.category,
        trackingType: h.trackingType,
        targetValue: h.targetValue,
        targetUnit: h.targetUnit,
        completedToday: logMap.get(h._id.toString())?.completed || false,
        todayValue: logMap.get(h._id.toString())?.value,
      })),
    };
  },
});

// Preset habits for 75 Hard
export const create75HardHabits = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const presets = [
      {
        name: "Follow diet",
        description: "Stick to your chosen diet with no cheat meals",
        icon: "🥗",
        category: "nutrition" as const,
        trackingType: "boolean" as const,
        frequency: "daily" as const,
      },
      {
        name: "Workout #1",
        description: "45 minute workout (one must be outdoors)",
        icon: "🏋️",
        category: "fitness" as const,
        trackingType: "duration" as const,
        targetValue: 45,
        targetUnit: "minutes",
        frequency: "daily" as const,
      },
      {
        name: "Workout #2",
        description: "Second 45 minute workout",
        icon: "🏃",
        category: "fitness" as const,
        trackingType: "duration" as const,
        targetValue: 45,
        targetUnit: "minutes",
        frequency: "daily" as const,
      },
      {
        name: "Drink water",
        description: "Drink 1 gallon (128oz) of water",
        icon: "💧",
        category: "health" as const,
        trackingType: "count" as const,
        targetValue: 8,
        targetUnit: "glasses",
        frequency: "daily" as const,
      },
      {
        name: "Read 10 pages",
        description: "Read 10 pages of a non-fiction book",
        icon: "📚",
        category: "learning" as const,
        trackingType: "count" as const,
        targetValue: 10,
        targetUnit: "pages",
        frequency: "daily" as const,
      },
      {
        name: "Progress photo",
        description: "Take a progress picture",
        icon: "📸",
        category: "health" as const,
        trackingType: "boolean" as const,
        frequency: "daily" as const,
      },
      {
        name: "No alcohol",
        description: "No alcohol or cheat meals",
        icon: "🚫",
        category: "nutrition" as const,
        trackingType: "boolean" as const,
        frequency: "daily" as const,
      },
    ];

    const ids = [];
    for (const preset of presets) {
      const id = await ctx.db.insert("habits", {
        userId: args.userId,
        ...preset,
        isActive: true,
        createdAt: Date.now(),
      });
      ids.push(id);
    }

    return ids;
  },
});
