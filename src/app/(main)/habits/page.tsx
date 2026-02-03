"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, Plus, Check, ChevronRight, 
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
    <main className="min-h-dvh p-6 safe-top safe-bottom">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-7 h-7 text-accent" />
          Daily Habits
        </h1>
        <p className="text-muted-foreground mt-1">Build consistency, one day at a time</p>
      </motion.header>

      {/* Progress Ring */}
      {totalCount > 0 && (
        <motion.section
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          <div className="p-6 rounded-3xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20 flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-secondary"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${progress * 2.51} 251`}
                  strokeLinecap="round"
                  className="text-accent transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{completedCount}/{totalCount}</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold">
                {progress === 100 ? "All done! 🎉" : progress > 50 ? "Keep going!" : "Let's crush it!"}
              </p>
              <p className="text-sm text-muted-foreground">
                {totalCount - completedCount} habits remaining today
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
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Active Streaks
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {streaks.filter(s => s.currentStreak > 0).map(streak => (
              <div
                key={streak.habitId}
                className="flex-shrink-0 px-4 py-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{streak.icon || "✨"}</span>
                  <div>
                    <p className="font-semibold text-sm">{streak.currentStreak} days</p>
                    <p className="text-xs text-muted-foreground">{streak.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Habits List */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Habits</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent"
          >
            <Plus className="w-5 h-5" />
          </button>
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Start tracking your daily habits. Add your own or try a preset.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSetup75Hard}
                className="w-full max-w-xs mx-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Start 75 Hard Challenge
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="w-full max-w-xs mx-auto px-6 py-3 bg-muted rounded-xl font-semibold"
              >
                Add Custom Habit
              </button>
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
    fitness: "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
    nutrition: "from-green-500/10 to-emerald-500/10 border-green-500/20",
    mindfulness: "from-purple-500/10 to-violet-500/10 border-purple-500/20",
    learning: "from-amber-500/10 to-yellow-500/10 border-amber-500/20",
    productivity: "from-rose-500/10 to-pink-500/10 border-rose-500/20",
    health: "from-teal-500/10 to-cyan-500/10 border-teal-500/20",
    custom: "from-gray-500/10 to-slate-500/10 border-gray-500/20",
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-br ${categoryColors[habit.category] || categoryColors.custom} border transition-all ${
        habit.isCompletedToday ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onToggle}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            habit.isCompletedToday
              ? "bg-accent text-white"
              : "bg-white/50 dark:bg-white/10"
          }`}
        >
          {habit.isCompletedToday ? (
            <Check className="w-5 h-5" />
          ) : (
            <span className="text-xl">{habit.icon || "✨"}</span>
          )}
        </button>

        <div className="flex-1">
          <p className={`font-semibold ${habit.isCompletedToday ? "line-through" : ""}`}>
            {habit.name}
          </p>
          {habit.description && (
            <p className="text-sm text-muted-foreground">{habit.description}</p>
          )}
          {habit.targetValue && (
            <p className="text-xs text-muted-foreground mt-1">
              Target: {habit.targetValue} {habit.targetUnit}
            </p>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
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
    { id: "mindfulness", label: "Mindfulness", icon: "🧘" },
    { id: "learning", label: "Learning", icon: "📚" },
    { id: "productivity", label: "Productivity", icon: "⚡" },
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
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-md bg-background rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">New Habit</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Habit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meditate for 10 minutes"
              className="w-full p-4 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id as any);
                    setIcon(cat.icon);
                  }}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                    category === cat.id
                      ? "bg-accent/10 ring-2 ring-accent"
                      : "bg-muted hover:bg-secondary"
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="w-full py-4 bg-accent text-accent-foreground rounded-xl font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "Adding..." : "Add Habit"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
