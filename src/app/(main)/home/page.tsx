"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TactileCard,
  TactileButton,
  TactileCheckbox,
  TactileProgress,
  TactileBadge,
  TactileListItem,
  TactileDivider,
  TactileFAB,
} from "@/components/tactile/TactileElements";
import { MessageCircle, Flame, BookOpen, Target, Brain, Sparkles, Plus } from "lucide-react";

const TOPIC_CONFIG = {
  philosophy: { emoji: "🤔", color: "#9b7bb8" },
  history: { emoji: "📜", color: "#7d9b76" },
  economics: { emoji: "📈", color: "#7a99b5" },
  art: { emoji: "🎨", color: "#c4956a" },
  psychology: { emoji: "🧠", color: "#c27c7c" },
};

export default function HomePage() {
  const { user } = useUser();
  const router = useRouter();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });
  const stats = useQuery(api.knowledge.getStats, {
    userId: userData?.user?._id || ("" as any),
  });
  const todayCards = useQuery(api.knowledge.getTodayCards, {
    userId: userData?.user?._id || ("" as any),
  });
  const habitProgress = useQuery(api.habits.getTodayProgress, {
    userId: userData?.user?._id || ("" as any),
  });
  const generateCards = useMutation(api.knowledge.generateDailyCards);
  const syncUser = useMutation(api.users.syncUser);
  const logHabit = useMutation(api.habits.logHabit);

  // Sync user on first load
  useEffect(() => {
    if (user && !userData?.user) {
      syncUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || user.firstName || undefined,
        imageUrl: user.imageUrl || undefined,
      });
    }
  }, [user, userData, syncUser]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (userData?.user && userData?.learningProgress && !userData.learningProgress.preferredStyle) {
      router.push("/onboarding");
    }
  }, [userData, router]);

  // Generate cards if needed
  useEffect(() => {
    if (userData?.user && todayCards?.length === 0) {
      generateCards({ userId: userData.user._id });
    }
  }, [userData, todayCards, generateCards]);

  if (!userData?.user) {
    return (
      <div 
        style={{ 
          minHeight: "100vh", 
          background: "#f0e6d8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 60,
            height: 60,
            background: "linear-gradient(145deg, #c4956a, #b38656)",
            borderRadius: 16,
            boxShadow: "4px 4px 12px rgba(0, 0, 0, 0.1), -2px -2px 8px rgba(255, 255, 255, 0.5)",
          }}
        />
      </div>
    );
  }

  const firstName = userData.user.name?.split(" ")[0] || "friend";
  const completedHabits = habitProgress?.filter(h => h.isCompletedToday).length || 0;
  const totalHabits = habitProgress?.length || 0;
  const completedCards = todayCards?.filter(c => c.completed).length || 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0e6d8",
        padding: "24px 16px",
        paddingBottom: 100,
      }}
    >
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ marginBottom: 24 }}
        >
          <p style={{ color: "#8a7b6d", fontSize: 14, marginBottom: 4 }}>
            {getGreeting()}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#4a4035", margin: 0 }}>
              {firstName}
            </h1>
            {stats && stats.currentStreak > 0 && (
              <TactileBadge color="warning">
                <Flame size={14} style={{ marginRight: 4, display: "inline" }} />
                {stats.currentStreak} day streak
              </TactileBadge>
            )}
          </div>
        </motion.div>

        {/* Daily Progress Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <TactileCard style={{ marginBottom: 20 }} variant="floating">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "linear-gradient(145deg, #c4956a, #b38656)",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "4px 4px 12px rgba(196, 149, 106, 0.3)",
                }}
              >
                <Sparkles size={28} color="white" />
              </div>
              <div>
                <p style={{ color: "#4a4035", fontSize: 18, fontWeight: 600, margin: 0 }}>
                  Today's Progress
                </p>
                <p style={{ color: "#8a7b6d", fontSize: 14, margin: 0 }}>
                  {completedCards + completedHabits} / {(todayCards?.length || 0) + totalHabits} completed
                </p>
              </div>
            </div>
            <TactileProgress 
              value={completedCards + completedHabits} 
              max={(todayCards?.length || 0) + totalHabits || 1} 
            />
          </TactileCard>
        </motion.div>

        {/* Habits Section */}
        {habitProgress && habitProgress.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#4a4035", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Target size={20} color="#7d9b76" />
                Habits
              </h2>
              <Link href="/habits" style={{ color: "#c4956a", fontSize: 14, textDecoration: "none" }}>
                See all →
              </Link>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {habitProgress.slice(0, 4).map((habit, index) => (
                <motion.div
                  key={habit._id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <TactileListItem
                    onClick={() => logHabit({
                      userId: userData.user._id,
                      habitId: habit._id,
                      completed: !habit.isCompletedToday,
                    })}
                    active={habit.isCompletedToday}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <TactileCheckbox
                        checked={habit.isCompletedToday}
                        onChange={() => {}}
                      />
                      <span style={{ 
                        color: habit.isCompletedToday ? "#8a7b6d" : "#4a4035",
                        textDecoration: habit.isCompletedToday ? "line-through" : "none",
                        fontSize: 16,
                      }}>
                        {habit.icon} {habit.name}
                      </span>
                    </div>
                  </TactileListItem>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Knowledge Cards Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#4a4035", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={20} color="#9b7bb8" />
              Today's Discoveries
            </h2>
            <span style={{ color: "#8a7b6d", fontSize: 14 }}>
              {completedCards}/{todayCards?.length || 0}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {todayCards?.map((card, index) => {
              const config = TOPIC_CONFIG[card.topic as keyof typeof TOPIC_CONFIG];
              
              return (
                <motion.div
                  key={card._id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Link href={`/explore/${card._id}`} style={{ textDecoration: "none" }}>
                    <TactileCard
                      variant={card.completed ? "pressed" : "raised"}
                      style={{ 
                        opacity: card.completed ? 0.7 : 1,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            background: card.completed 
                              ? "#e8ddd0"
                              : `linear-gradient(145deg, ${config?.color || "#c4956a"}, ${adjustColor(config?.color || "#c4956a", -15)})`,
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                            boxShadow: card.completed 
                              ? "inset 2px 2px 6px rgba(0, 0, 0, 0.08)"
                              : `3px 3px 10px ${config?.color || "#c4956a"}30`,
                          }}
                        >
                          {card.completed ? "✓" : config?.emoji || "📚"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ 
                            color: card.completed ? "#8a7b6d" : "#4a4035", 
                            fontSize: 16, 
                            fontWeight: 600, 
                            margin: 0,
                            textDecoration: card.completed ? "line-through" : "none",
                          }}>
                            {card.topic.charAt(0).toUpperCase() + card.topic.slice(1)}
                          </p>
                          <p style={{ color: "#8a7b6d", fontSize: 13, margin: "2px 0 0 0" }}>
                            {card.completed ? card.title : "Tap to explore"}
                          </p>
                        </div>
                      </div>
                    </TactileCard>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Link href="/chat" style={{ textDecoration: "none" }}>
              <TactileCard style={{ padding: 16, textAlign: "center" }}>
                <MessageCircle size={28} color="#7a99b5" style={{ marginBottom: 8 }} />
                <p style={{ color: "#4a4035", fontSize: 14, fontWeight: 600, margin: 0 }}>
                  Chat with Nous
                </p>
              </TactileCard>
            </Link>
            <Link href="/journal" style={{ textDecoration: "none" }}>
              <TactileCard style={{ padding: 16, textAlign: "center" }}>
                <Brain size={28} color="#c4956a" style={{ marginBottom: 8 }} />
                <p style={{ color: "#4a4035", fontSize: 14, fontWeight: 600, margin: 0 }}>
                  Journal
                </p>
              </TactileCard>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* FAB */}
      <Link href="/habits">
        <TactileFAB icon={<Plus size={28} />} />
      </Link>
    </div>
  );
}

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
