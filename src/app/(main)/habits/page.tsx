"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Plus, X, Flame, Trophy } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { TapeStrip, StickyNote, PencilCheckbox, CoffeeStain, Doodle, PaperClip } from "@/components/paper/PaperElements";

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
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: "#666" }}>
          Loading your habits...
        </p>
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
    <div style={{ padding: "20px 16px", maxWidth: 500, margin: "0 auto", position: "relative" }}>
      {/* Header */}
      <div 
        style={{
          background: "#f5f0e6",
          padding: "20px 24px",
          marginBottom: 20,
          position: "relative",
          boxShadow: "3px 4px 12px rgba(0,0,0,0.15)",
          clipPath: "polygon(0% 0%, 100% 1%, 99% 99%, 1% 100%)",
        }}
      >
        <TapeStrip style={{ top: -8, left: 30 }} rotation={-2} color="cream" />
        <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, color: "#2c2c2c", margin: 0 }}>
          daily habits 💪
        </h1>
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: "#666", marginTop: 4 }}>
          {completedCount}/{totalCount} done today
        </p>
      </div>

      {/* Progress sticky note */}
      {totalCount > 0 && (
        <div style={{ position: "absolute", right: 0, top: 100, zIndex: 5 }}>
          <StickyNote color="yellow" rotation={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 600 }}>{Math.round((completedCount / totalCount) * 100)}%</div>
              <div style={{ fontSize: 14 }}>complete!</div>
            </div>
          </StickyNote>
        </div>
      )}

      {/* Streaks */}
      {streaks && streaks.some(s => s.currentStreak > 0) && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Architects Daughter', cursive", fontSize: 18, color: "#2c2c2c", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={20} color="#ff6b6b" /> streaks
          </h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {streaks.filter(s => s.currentStreak > 0).map(streak => (
              <div
                key={streak.habitId}
                style={{
                  padding: "8px 14px",
                  background: "#fff9c4",
                  borderRadius: 8,
                  boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
                  transform: `rotate(${(Math.random() - 0.5) * 4}deg)`,
                }}
              >
                <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 16 }}>
                  {streak.icon} {streak.currentStreak}d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habits list - lined paper */}
      <div
        style={{
          background: "#fefcf6",
          backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #e8dcd0 28px)",
          backgroundSize: "100% 28px",
          padding: "24px 20px 24px 56px",
          position: "relative",
          minHeight: 300,
          boxShadow: "4px 5px 15px rgba(0,0,0,0.2)",
          borderLeft: "3px solid #e8b4b4",
        }}
      >
        {/* Red margin line */}
        <div style={{ position: "absolute", left: 46, top: 0, bottom: 0, width: 2, background: "#ffcccb" }} />
        
        <CoffeeStain style={{ bottom: 40, right: 20, opacity: 0.5 }} />
        <PaperClip style={{ top: -15, right: 25 }} />

        {todayProgress && todayProgress.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todayProgress.map((habit, index) => {
              const rotation = (Math.random() - 0.5) * 2;
              return (
                <div
                  key={habit._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 0",
                    transform: `rotate(${rotation}deg)`,
                  }}
                >
                  <PencilCheckbox
                    checked={habit.isCompletedToday}
                    onChange={() => logHabit({
                      userId: userData.user._id,
                      habitId: habit._id,
                      completed: !habit.isCompletedToday,
                    })}
                  />
                  <span
                    style={{
                      fontFamily: "'Architects Daughter', cursive",
                      fontSize: 18,
                      color: habit.isCompletedToday ? "#888" : "#2c2c2c",
                      textDecoration: habit.isCompletedToday ? "line-through" : "none",
                      textDecorationColor: "#666",
                      textDecorationThickness: 2,
                    }}
                  >
                    {habit.icon} {habit.name}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h3 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: "#2c2c2c", marginBottom: 8 }}>
              no habits yet
            </h3>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: "#666", marginBottom: 20 }}>
              start tracking your daily habits!
            </p>
            <button
              onClick={() => create75Hard({ userId: userData.user._id })}
              style={{
                fontFamily: "'Permanent Marker', cursive",
                fontSize: 14,
                padding: "12px 20px",
                background: "linear-gradient(180deg, #ff6b6b 0%, #ee5a5a 100%)",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                boxShadow: "2px 3px 6px rgba(0,0,0,0.2)",
                transform: "rotate(-1deg)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: "0 auto",
              }}
            >
              <Trophy size={18} /> start 75 hard
            </button>
          </div>
        )}

        <Doodle type="star" style={{ bottom: 15, left: -30 }} />
      </div>

      {/* Add habit button */}
      <button
        onClick={() => setShowAdd(true)}
        style={{
          position: "fixed",
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "#2d5016",
          color: "white",
          border: "none",
          cursor: "pointer",
          boxShadow: "3px 4px 10px rgba(0,0,0,0.2)",
          transform: "rotate(3deg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
        }}
      >
        <Plus size={28} />
      </button>

      {/* Add habit modal */}
      {showAdd && (
        <div
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
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              background: "#f5f0e6",
              borderRadius: "24px 24px 0 0",
              padding: 24,
              boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, margin: 0 }}>new habit</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={24} />
              </button>
            </div>
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g., Meditate 10 min"
              autoFocus
              style={{
                width: "100%",
                padding: "14px 18px",
                border: "2px solid #e8dcd0",
                borderRadius: 12,
                background: "#fefcf6",
                fontFamily: "'Architects Daughter', cursive",
                fontSize: 18,
                marginBottom: 16,
                outline: "none",
              }}
            />
            <button
              onClick={handleAddHabit}
              disabled={!newHabitName.trim()}
              style={{
                width: "100%",
                padding: "14px",
                background: newHabitName.trim() ? "#2d5016" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontFamily: "'Permanent Marker', cursive",
                fontSize: 16,
                cursor: newHabitName.trim() ? "pointer" : "not-allowed",
              }}
            >
              add habit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
