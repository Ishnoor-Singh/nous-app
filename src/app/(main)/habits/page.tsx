"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Flame, Trophy, Target } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { TactileCard, TactileCheckbox, TactileProgress, TactileBadge, TactileButton, TactileFAB } from "@/components/tactile/TactileElements";

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
  const createHabit = useMutation(api.habits.createHabit);

  const [showAdd, setShowAdd] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");

  if (!userData?.user) {
    return (
      <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 48,
            height: 48,
            background: "linear-gradient(145deg, #c4956a, #b38656)",
            borderRadius: 14,
          }}
        />
      </div>
    );
  }

  const completedCount = todayProgress?.filter(h => h.isCompletedToday).length || 0;
  const totalCount = todayProgress?.length || 0;

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;
    await createHabit({
      userId: userData.user._id,
      name: newHabitName.trim(),
      icon: "✨",
      category: "custom",
      trackingType: "boolean",
      frequency: "daily",
    });
    setNewHabitName("");
    setShowAdd(false);
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 500, margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ marginBottom: 24 }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#4a4035", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Target size={28} color="#7d9b76" />
          Daily Habits
        </h1>
        <p style={{ color: "#8a7b6d", margin: "4px 0 0 0" }}>
          Build consistency, one day at a time
        </p>
      </motion.div>

      {/* Progress Card */}
      {totalCount > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <TactileCard variant="floating" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: completedCount === totalCount 
                    ? "linear-gradient(145deg, #7d9b76, #6b8965)"
                    : "linear-gradient(145deg, #c4956a, #b38656)",
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "4px 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              >
                <span style={{ fontSize: 28, color: "white", fontWeight: 700 }}>
                  {completedCount}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#4a4035", margin: 0 }}>
                  {completedCount === totalCount ? "All done! 🎉" : `${totalCount - completedCount} to go`}
                </p>
                <p style={{ color: "#8a7b6d", margin: "2px 0 0 0" }}>
                  {completedCount} of {totalCount} completed
                </p>
              </div>
            </div>
            <TactileProgress value={completedCount} max={totalCount} color="#7d9b76" />
          </TactileCard>
        </motion.div>
      )}

      {/* Streaks */}
      {streaks && streaks.some(s => s.currentStreak > 0) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: 24 }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#4a4035", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={18} color="#d4a574" /> Active Streaks
          </h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {streaks.filter(s => s.currentStreak > 0).map(streak => (
              <TactileBadge key={streak.habitId} color="warning">
                {streak.icon} {streak.currentStreak}d
              </TactileBadge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Habits List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#4a4035", marginBottom: 12 }}>
          Today's Habits
        </h2>

        {todayProgress && todayProgress.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {todayProgress.map((habit, index) => (
              <motion.div
                key={habit._id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <TactileCard
                  onClick={() => logHabit({
                    userId: userData.user._id,
                    habitId: habit._id,
                    completed: !habit.isCompletedToday,
                  })}
                  variant={habit.isCompletedToday ? "pressed" : "raised"}
                  style={{ 
                    padding: 16,
                    opacity: habit.isCompletedToday ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <TactileCheckbox
                      checked={habit.isCompletedToday}
                      onChange={() => {}}
                    />
                    <span style={{ 
                      fontSize: 16, 
                      color: habit.isCompletedToday ? "#8a7b6d" : "#4a4035",
                      textDecoration: habit.isCompletedToday ? "line-through" : "none",
                      fontWeight: 500,
                    }}>
                      {habit.icon} {habit.name}
                    </span>
                  </div>
                </TactileCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <TactileCard style={{ textAlign: "center", padding: "48px 24px" }}>
            <div
              style={{
                width: 72,
                height: 72,
                background: "linear-gradient(145deg, #c4956a, #b38656)",
                borderRadius: 20,
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "4px 4px 12px rgba(196, 149, 106, 0.25)",
              }}
            >
              <Target size={36} color="white" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#4a4035", marginBottom: 8 }}>
              No habits yet
            </h3>
            <p style={{ color: "#8a7b6d", marginBottom: 24 }}>
              Start tracking your daily habits
            </p>
            <TactileButton
              onClick={() => create75Hard({ userId: userData.user._id })}
              variant="primary"
              style={{ marginBottom: 12 }}
            >
              <Trophy size={18} style={{ marginRight: 8 }} />
              Start 75 Hard Challenge
            </TactileButton>
          </TactileCard>
        )}
      </motion.div>

      {/* FAB */}
      <TactileFAB icon={<Plus size={28} />} onClick={() => setShowAdd(true)} />

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              zIndex: 100,
              padding: 16,
            }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              style={{
                width: "100%",
                maxWidth: 400,
                background: "linear-gradient(180deg, #f7f0e6 0%, #f0e6d8 100%)",
                borderRadius: "28px 28px 0 0",
                padding: 24,
                boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#4a4035", margin: 0 }}>New Habit</h2>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAdd(false)} 
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
                >
                  <X size={24} color="#8a7b6d" />
                </motion.button>
              </div>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g., Meditate 10 min"
                autoFocus
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  background: "#e8ddd0",
                  border: "none",
                  borderRadius: 16,
                  fontSize: 16,
                  color: "#4a4035",
                  marginBottom: 16,
                  outline: "none",
                  boxShadow: "inset 2px 2px 6px rgba(0, 0, 0, 0.08), inset -1px -1px 4px rgba(255, 255, 255, 0.3)",
                }}
              />
              <TactileButton
                onClick={handleAddHabit}
                disabled={!newHabitName.trim()}
                variant="primary"
                style={{ width: "100%" }}
              >
                Add Habit
              </TactileButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
