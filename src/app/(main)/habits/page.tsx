"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, Plus, Check, 
  Sparkles, Target, Trophy, X
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

export default function HabitsPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });
  const todayProgress = useQuery(api.habits.getTodayProgress, {
    userId: userData?.user?._id || ("" as any),
  });
  const streaks = useQuery(api.habits.getStreaks, {
    userId: userData?.user?._id || ("" as any),
  });
  const logHabit = useMutation(api.habits.logHabit);
  const create75Hard = useMutation(api.habits.create75HardHabits);

  const [showAdd, setShowAdd] = useState(false);

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const completedCount = todayProgress?.filter(h => h.isCompletedToday).length || 0;
  const totalCount = todayProgress?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = async (habitId: Id<"habits">, currentlyCompleted: boolean) => {
    await logHabit({
      userId: userData.user._id,
      habitId,
      completed: !currentlyCompleted,
    });
  };

  const handleSetup75Hard = async () => {
    await create75Hard({ userId: userData.user._id });
  };

  return (
    <main className="min-h-dvh p-6 safe-top">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 text-glow">
          <Target className="w-8 h-8 text-accent" />
          Daily Habits
        </h1>
        <p className="text-white/50 mt-1">Build consistency, one day at a time</p>
      </motion.header>

      {/* Progress Ring */}
      {totalCount > 0 && (
        <motion.section
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          <div className="p-6 rounded-3xl glass-card glass-accent flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251" }}
                  animate={{ strokeDasharray: `${progress * 2.51} 251` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))" }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{completedCount}/{totalCount}</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {progress === 100 ? "All done! 🎉" : progress > 50 ? "Keep going! 💪" : "Let's crush it! 🚀"}
              </p>
              <p className="text-sm text-white/50">
                {totalCount - completedCount} {totalCount - completedCount === 1 ? 'habit' : 'habits'} remaining today
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Streaks */}
      {streaks && streaks.some(s => s.currentStreak > 0) && (
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Active Streaks
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {streaks.filter(s => s.currentStreak > 0).map((streak, index) => (
              <motion.div
                key={streak.habitId}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 px-4 py-3 rounded-xl glass-card glass-warning"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{streak.icon || "✨"}</span>
                  <div>
                    <p className="font-bold text-white">{streak.currentStreak} days 🔥</p>
                    <p className="text-xs text-white/50">{streak.name}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Habits List */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Today's Habits</h2>
          <motion.button
            onClick={() => setShowAdd(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full glass-button flex items-center justify-center text-accent glow-accent"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {todayProgress && todayProgress.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {todayProgress.map((habit, index) => (
                <motion.div
                  key={habit._id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <HabitCard
                    habit={habit}
                    onToggle={() => handleToggle(habit._id, habit.isCompletedToday)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(99, 102, 241, 0.2)",
                  "0 0 40px rgba(99, 102, 241, 0.4)",
                  "0 0 20px rgba(99, 102, 241, 0.2)",
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 mx-auto mb-6 rounded-full glass-accent flex items-center justify-center"
            >
              <Sparkles className="w-12 h-12 text-accent" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-3">No habits yet</h3>
            <p className="text-white/50 mb-8 max-w-xs mx-auto">
              Start small! Track one habit at a time and build from there.
            </p>
            <div className="space-y-3">
              <motion.button
                onClick={() => setShowAdd(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full max-w-xs mx-auto px-6 py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                style={{ boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}
              >
                <Plus className="w-5 h-5" />
                Create Your First Habit
              </motion.button>
              <details className="w-full max-w-xs mx-auto">
                <summary className="text-white/40 text-sm cursor-pointer hover:text-white/60 transition-colors text-center py-2">
                  Or try a preset challenge...
                </summary>
                <motion.button
                  onClick={handleSetup75Hard}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-2 px-6 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-300 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <Trophy className="w-4 h-4" />
                  75 Hard Challenge (Advanced)
                </motion.button>
              </details>
            </div>
          </motion.div>
        )}
      </section>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddHabitModal 
            userId={userData.user._id} 
            onClose={() => setShowAdd(false)} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function HabitCard({ habit, onToggle }: { habit: any; onToggle: () => void }) {
  const categoryColors: Record<string, string> = {
    fitness: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    nutrition: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    mindfulness: "from-purple-500/20 to-violet-500/20 border-purple-500/30",
    learning: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
    productivity: "from-rose-500/20 to-pink-500/20 border-rose-500/30",
    health: "from-teal-500/20 to-cyan-500/20 border-teal-500/30",
    custom: "from-white/5 to-white/10 border-white/10",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`p-4 rounded-2xl glass-card bg-gradient-to-br ${categoryColors[habit.category] || categoryColors.custom} backdrop-blur-xl transition-all ${
        habit.isCompletedToday ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            habit.isCompletedToday
              ? "bg-gradient-to-br from-accent to-purple-600 glow-accent"
              : "glass-button"
          }`}
        >
          {habit.isCompletedToday ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <span className="text-2xl">{habit.icon || "✨"}</span>
          )}
        </motion.button>

        <div className="flex-1">
          <p className={`font-semibold text-white ${habit.isCompletedToday ? "line-through opacity-60" : ""}`}>
            {habit.name}
          </p>
          {habit.description && (
            <p className="text-sm text-white/50">{habit.description}</p>
          )}
          {habit.targetValue && (
            <p className="text-xs text-white/40 mt-1">
              Target: {habit.targetValue} {habit.targetUnit}
            </p>
          )}
        </div>

        {/* Streak indicator */}
        {habit.currentStreak > 0 && (
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">{habit.currentStreak}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AddHabitModal({ userId, onClose }: { userId: Id<"users">; onClose: () => void }) {
  const createHabit = useMutation(api.habits.createHabit);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"fitness" | "nutrition" | "mindfulness" | "learning" | "productivity" | "health" | "custom">("custom");
  const [icon, setIcon] = useState("✨");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: "fitness", label: "Fitness", icon: "🏋️" },
    { id: "nutrition", label: "Nutrition", icon: "🥗" },
    { id: "mindfulness", label: "Mind", icon: "🧘" },
    { id: "learning", label: "Learn", icon: "📚" },
    { id: "productivity", label: "Prod", icon: "⚡" },
    { id: "health", label: "Health", icon: "❤️" },
    { id: "custom", label: "Other", icon: "✨" },
  ];

  const handleSubmit = async () => {
    if (!name.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await createHabit({
        userId,
        name: name.trim(),
        icon,
        category,
        trackingType: "boolean",
        frequency: "daily",
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">New Habit</h2>
          <motion.button 
            onClick={onClose} 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full glass-button"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-white/60 mb-2 block">
              Habit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meditate for 10 minutes"
              className="w-full p-4 glass-input rounded-xl"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white/60 mb-2 block">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id as any);
                    setIcon(cat.icon);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                    category === cat.id
                      ? "glass-accent glow-accent"
                      : "glass-button"
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs text-white/70">{cat.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 glow-accent"
          >
            {isSubmitting ? "Adding..." : "Add Habit"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
