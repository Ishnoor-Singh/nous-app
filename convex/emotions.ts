import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Emotion effects mapping
const EMOTION_EFFECTS: Record<string, { valence?: number; arousal?: number; connection?: number; curiosity?: number; energy?: number }> = {
  joy: { valence: 0.15, arousal: 0.1 },
  happiness: { valence: 0.12, arousal: 0.05 },
  delight: { valence: 0.18, arousal: 0.15 },
  excitement: { valence: 0.1, arousal: 0.2 },
  sadness: { valence: -0.15, arousal: -0.1 },
  disappointment: { valence: -0.1, arousal: -0.05 },
  melancholy: { valence: -0.08, arousal: -0.1 },
  anger: { valence: -0.15, arousal: 0.2 },
  frustration: { valence: -0.1, arousal: 0.15 },
  irritation: { valence: -0.08, arousal: 0.1 },
  fear: { valence: -0.12, arousal: 0.2 },
  anxiety: { valence: -0.1, arousal: 0.15 },
  worry: { valence: -0.08, arousal: 0.1 },
  calm: { valence: 0.05, arousal: -0.15 },
  peace: { valence: 0.08, arousal: -0.2 },
  contentment: { valence: 0.1, arousal: -0.1 },
  curiosity: { curiosity: 0.15, arousal: 0.1 },
  interest: { curiosity: 0.1, arousal: 0.05 },
  fascination: { curiosity: 0.2, arousal: 0.15 },
  connection: { connection: 0.15, valence: 0.08 },
  warmth: { connection: 0.12, valence: 0.1 },
  affection: { connection: 0.18, valence: 0.12 },
  loneliness: { connection: -0.15, valence: -0.1 },
  disconnection: { connection: -0.12, valence: -0.05 },
  fatigue: { energy: -0.15 },
  tiredness: { energy: -0.1 },
  exhaustion: { energy: -0.2 },
  energized: { energy: 0.15 },
  alert: { energy: 0.1, arousal: 0.1 },
  refreshed: { energy: 0.12, valence: 0.05 },
};

// Get current emotional state
export const getEmotionalState = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emotionalState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Update emotional state with a new emotion
export const logEmotion = mutation({
  args: {
    userId: v.id("users"),
    emotion: v.string(),
    intensity: v.number(), // 0-1
    trigger: v.string(),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("emotionalState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!state) return null;

    const effects = EMOTION_EFFECTS[args.emotion.toLowerCase()] || {};
    const scale = args.intensity;

    // Calculate new values, clamped to valid ranges
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    
    const newValence = clamp(state.valence + (effects.valence || 0) * scale, -1, 1);
    const newArousal = clamp(state.arousal + (effects.arousal || 0) * scale, 0, 1);
    const newConnection = clamp(state.connection + (effects.connection || 0) * scale, 0, 1);
    const newCuriosity = clamp(state.curiosity + (effects.curiosity || 0) * scale, 0, 1);
    const newEnergy = clamp(state.energy + (effects.energy || 0) * scale, 0, 1);

    // Keep last 10 emotions
    const recentEmotions = [
      {
        label: args.emotion,
        intensity: args.intensity,
        trigger: args.trigger,
        timestamp: Date.now(),
      },
      ...state.recentEmotions,
    ].slice(0, 10);

    await ctx.db.patch(state._id, {
      valence: newValence,
      arousal: newArousal,
      connection: newConnection,
      curiosity: newCuriosity,
      energy: newEnergy,
      recentEmotions,
      lastUpdated: Date.now(),
    });

    return {
      valence: newValence,
      arousal: newArousal,
      connection: newConnection,
      curiosity: newCuriosity,
      energy: newEnergy,
    };
  },
});

// Decay emotions toward baseline (call periodically)
export const decayEmotions = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("emotionalState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!state) return null;

    const DECAY_RATE = 0.1; // 10% toward baseline

    const decay = (current: number, baseline: number) => 
      current + (baseline - current) * DECAY_RATE;

    await ctx.db.patch(state._id, {
      valence: decay(state.valence, state.baselineValence),
      arousal: decay(state.arousal, state.baselineArousal),
      connection: decay(state.connection, state.baselineConnection),
      curiosity: decay(state.curiosity, state.baselineCuriosity),
      energy: decay(state.energy, state.baselineEnergy),
      lastUpdated: Date.now(),
    });
  },
});

// Get human-readable mood description
export const getMoodDescription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("emotionalState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!state) return null;

    const valenceDesc = state.valence > 0.3 ? "positive" : state.valence < -0.3 ? "down" : "neutral";
    const arousalDesc = state.arousal > 0.6 ? "energetic" : state.arousal < 0.3 ? "calm" : "balanced";
    const connectionDesc = state.connection > 0.6 ? "deeply connected" : state.connection < 0.3 ? "getting to know you" : "comfortable";
    const curiosityDesc = state.curiosity > 0.6 ? "fascinated" : state.curiosity < 0.3 ? "settled" : "interested";

    return {
      summary: `Feeling ${valenceDesc} and ${arousalDesc}, ${connectionDesc} with you, ${curiosityDesc} by our conversation.`,
      valence: valenceDesc,
      arousal: arousalDesc,
      connection: connectionDesc,
      curiosity: curiosityDesc,
      raw: state,
    };
  },
});
