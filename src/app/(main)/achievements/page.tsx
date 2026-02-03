"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Trophy, Flame, Brain, Star, Filter } from "lucide-react";
import { useState } from "react";
import { AchievementCard, SAMPLE_ACHIEVEMENTS, Achievement } from "@/components/gamification/Achievements";

const CATEGORIES = [
  { id: "all", label: "All", icon: Star },
  { id: "streak", label: "Streaks", icon: Flame },
  { id: "learning", label: "Learning", icon: Brain },
  { id: "mastery", label: "Mastery", icon: Trophy },
];

export default function AchievementsPage() {
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter achievements by category
  const filteredAchievements = selectedCategory === "all"
    ? SAMPLE_ACHIEVEMENTS
    : SAMPLE_ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  // Count stats
  const totalAchievements = SAMPLE_ACHIEVEMENTS.length;
  const unlockedCount = SAMPLE_ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalProgress = Math.round(
    SAMPLE_ACHIEVEMENTS.reduce((sum, a) => sum + a.progress, 0) / totalAchievements
  );

  return (
    <main className="min-h-dvh p-6 safe-top">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-muted-foreground">
          Track your learning journey
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        <StatCard 
          icon={<Trophy className="w-5 h-5" />}
          value={unlockedCount}
          label="Unlocked"
          color="from-amber-500 to-orange-600"
        />
        <StatCard 
          icon={<Star className="w-5 h-5" />}
          value={totalAchievements}
          label="Total"
          color="from-purple-500 to-violet-600"
        />
        <StatCard 
          icon={<Brain className="w-5 h-5" />}
          value={`${totalProgress}%`}
          label="Progress"
          color="from-emerald-500 to-green-600"
        />
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-6 px-6"
      >
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Achievement List */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        {/* Unlocked achievements first */}
        {filteredAchievements
          .sort((a, b) => {
            // Unlocked first, then by rarity
            if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
            const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
          })
          .map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <AchievementCard achievement={achievement} />
            </motion.div>
          ))}
      </motion.section>

      {/* Motivational footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground mt-8"
      >
        Keep exploring to unlock more achievements! 🏆
      </motion.p>
    </main>
  );
}

function StatCard({ icon, value, label, color }: { 
  icon: React.ReactNode; 
  value: string | number; 
  label: string;
  color: string;
}) {
  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} text-white`}>
      <div className="opacity-80 mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}
