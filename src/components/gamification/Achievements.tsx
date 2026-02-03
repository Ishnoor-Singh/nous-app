"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  Trophy, Flame, Brain, Star, Sparkles,
  BookOpen, MessageCircle, Heart, Zap, Target
} from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof ACHIEVEMENT_ICONS;
  category: "streak" | "learning" | "social" | "mastery";
  progress: number; // 0-100
  unlocked: boolean;
  unlockedAt?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const ACHIEVEMENT_ICONS = {
  trophy: Trophy,
  flame: Flame,
  brain: Brain,
  star: Star,
  sparkles: Sparkles,
  book: BookOpen,
  message: MessageCircle,
  heart: Heart,
  zap: Zap,
  target: Target,
};

const RARITY_COLORS = {
  common: "from-gray-400 to-gray-500",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-orange-500",
};

const RARITY_LABELS = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
}

export function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const Icon = ACHIEVEMENT_ICONS[achievement.icon] || Trophy;
  const rarityColor = RARITY_COLORS[achievement.rarity];
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 rounded-2xl text-left transition-all ${
        achievement.unlocked 
          ? "bg-muted" 
          : "bg-muted/50 opacity-60"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          achievement.unlocked 
            ? `bg-gradient-to-br ${rarityColor} text-white` 
            : "bg-secondary text-muted-foreground"
        }`}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{achievement.title}</p>
            {achievement.unlocked && (
              <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${rarityColor} text-white`}>
                {RARITY_LABELS[achievement.rarity]}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {achievement.description}
          </p>

          {/* Progress bar (if not unlocked) */}
          {!achievement.unlocked && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{achievement.progress}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.progress}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full bg-gradient-to-r ${rarityColor}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// Achievement unlock notification
export function AchievementUnlock({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.icon] || Trophy;
  const rarityColor = RARITY_COLORS[achievement.rarity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed inset-x-4 bottom-24 z-50 max-w-md mx-auto"
      >
        <div className={`bg-gradient-to-r ${rarityColor} p-1 rounded-2xl shadow-2xl`}>
          <div className="bg-background p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${rarityColor} flex items-center justify-center text-white`}
              >
                <Icon className="w-7 h-7" />
              </motion.div>

              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  🎉 Achievement Unlocked!
                </p>
                <p className="font-bold text-lg">{achievement.title}</p>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={onClose}
              className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Tap to dismiss
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Sample achievements
export const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-conversation",
    title: "First Words",
    description: "Have your first conversation with Nous",
    icon: "message",
    category: "social",
    progress: 100,
    unlocked: true,
    rarity: "common",
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    icon: "flame",
    category: "streak",
    progress: 42,
    unlocked: false,
    rarity: "rare",
  },
  {
    id: "deep-diver",
    title: "Deep Diver",
    description: "Reach depth level 5 in a single topic",
    icon: "brain",
    category: "mastery",
    progress: 60,
    unlocked: false,
    rarity: "epic",
  },
  {
    id: "polymath",
    title: "Polymath",
    description: "Explore all 5 knowledge domains",
    icon: "star",
    category: "learning",
    progress: 40,
    unlocked: false,
    rarity: "legendary",
  },
  {
    id: "night-owl",
    title: "Night Owl",
    description: "Learn after midnight 5 times",
    icon: "sparkles",
    category: "learning",
    progress: 20,
    unlocked: false,
    rarity: "rare",
  },
  {
    id: "question-asker",
    title: "Question Everything",
    description: "Ask 50 follow-up questions",
    icon: "zap",
    category: "learning",
    progress: 30,
    unlocked: false,
    rarity: "rare",
  },
];
