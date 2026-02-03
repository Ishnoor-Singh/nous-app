import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get journal entries for a user
export const getEntries = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 30);
  },
});

// Get entry for a specific date
export const getEntryByDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journalEntries")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
  },
});

// Get recent themes across entries
export const getRecentThemes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);

    const themeCounts = new Map<string, number>();
    for (const entry of entries) {
      for (const theme of entry.themes || []) {
        themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
      }
    }

    return Array.from(themeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));
  },
});

// Create or update journal entry
export const saveEntry = mutation({
  args: {
    userId: v.id("users"),
    date: v.optional(v.string()),
    prompt: v.optional(v.string()),
    content: v.string(),
    mood: v.optional(v.string()),
    themes: v.optional(v.array(v.string())),
    aiReflection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = args.date || new Date().toISOString().split("T")[0];
    const wordCount = args.content.split(/\s+/).filter(Boolean).length;

    // Check for existing entry
    const existing = await ctx.db
      .query("journalEntries")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        prompt: args.prompt,
        mood: args.mood,
        themes: args.themes,
        aiReflection: args.aiReflection,
        wordCount,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("journalEntries", {
      userId: args.userId,
      date,
      prompt: args.prompt,
      content: args.content,
      mood: args.mood,
      themes: args.themes,
      aiReflection: args.aiReflection,
      wordCount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get journaling prompts based on context
export const getPrompts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get recent entries to personalize prompts
    const recentEntries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5);

    const recentThemes = new Set<string>();
    for (const entry of recentEntries) {
      for (const theme of entry.themes || []) {
        recentThemes.add(theme);
      }
    }

    // Base prompts
    const prompts = [
      { category: "reflection", text: "What's one thing you learned about yourself today?" },
      { category: "gratitude", text: "What are three things you're grateful for right now?" },
      { category: "challenge", text: "What's something difficult you're facing? How might you approach it differently?" },
      { category: "growth", text: "In what small way did you grow today?" },
      { category: "intention", text: "What do you want tomorrow to look like?" },
      { category: "emotion", text: "What emotion has been most present today? Where do you feel it?" },
      { category: "relationship", text: "Who made a positive impact on your day? What did they do?" },
      { category: "curiosity", text: "What's something you're curious about lately?" },
    ];

    // Add context-aware prompts based on themes
    if (recentThemes.has("work") || recentThemes.has("career")) {
      prompts.push({ category: "work", text: "What would make your work feel more meaningful?" });
    }
    if (recentThemes.has("anxiety") || recentThemes.has("stress")) {
      prompts.push({ category: "calm", text: "What helps you feel calm? When was the last time you felt truly at peace?" });
    }

    return prompts;
  },
});

// Get journal stats
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalEntries = entries.length;
    const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0);
    
    // Calculate streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const hasEntry = entries.some(e => e.date === dateStr);
      if (hasEntry) {
        streak++;
      } else if (i > 0) { // Allow today to be missing
        break;
      }
    }

    return {
      totalEntries,
      totalWords,
      currentStreak: streak,
      averageWords: totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0,
    };
  },
});
