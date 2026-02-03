"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star, Trophy, Zap } from "lucide-react";

interface StreakCounterProps {
  streak: number;
  longestStreak?: number;
  showAnimation?: boolean;
}

export function StreakCounter({ streak, longestStreak, showAnimation = false }: StreakCounterProps) {
  const isNewRecord = longestStreak !== undefined && streak > 0 && streak === longestStreak;
  
  // Determine streak level and color
  const getStreakConfig = (count: number) => {
    if (count >= 30) return { level: "legendary", color: "from-amber-400 to-orange-500", icon: Trophy };
    if (count >= 14) return { level: "epic", color: "from-purple-400 to-violet-500", icon: Star };
    if (count >= 7) return { level: "rare", color: "from-blue-400 to-cyan-500", icon: Zap };
    return { level: "common", color: "from-orange-400 to-red-500", icon: Flame };
  };

  const config = getStreakConfig(streak);
  const Icon = config.icon;

  if (streak === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl">
        <Flame className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Start your streak!</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={showAnimation ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${config.color} text-white`}
    >
      <motion.div
        animate={showAnimation ? { rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <Icon className="w-5 h-5" />
      </motion.div>
      
      <div className="flex items-baseline gap-1">
        <motion.span
          key={streak}
          initial={showAnimation ? { y: -10, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl font-bold"
        >
          {streak}
        </motion.span>
        <span className="text-sm opacity-80">day{streak !== 1 ? "s" : ""}</span>
      </div>

      {/* New record badge */}
      <AnimatePresence>
        {isNewRecord && showAnimation && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 px-2 py-0.5 bg-white text-xs font-bold rounded-full text-amber-600 shadow-lg"
          >
            NEW!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Compact version for inline use
export function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-1 text-orange-500">
      <Flame className="w-4 h-4" />
      <span className="text-sm font-semibold">{streak}</span>
    </div>
  );
}

// Streak milestone celebration
export function StreakMilestone({ streak, onDismiss }: { streak: number; onDismiss: () => void }) {
  const milestones = [7, 14, 30, 50, 100];
  const currentMilestone = milestones.find(m => m === streak);
  
  if (!currentMilestone) return null;

  const messages: Record<number, { title: string; message: string }> = {
    7: { title: "One Week! 🎉", message: "You've learned every day for a week. That's how habits form." },
    14: { title: "Two Weeks Strong! 💪", message: "Half a month of consistent learning. You're building something real." },
    30: { title: "One Month! 🏆", message: "30 days of growth. You're not the same person who started." },
    50: { title: "Fifty Days! 🌟", message: "Most people don't make it this far. You're exceptional." },
    100: { title: "Century Club! 👑", message: "100 days. You've proven learning is part of who you are." },
  };

  const content = messages[currentMilestone];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-background p-8 rounded-3xl text-center max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 0.6 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
        >
          <Flame className="w-10 h-10 text-white" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4">
          {streak} Days
        </p>
        <p className="text-muted-foreground mb-6">
          {content.message}
        </p>

        <button
          onClick={onDismiss}
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-semibold"
        >
          Keep Going! 🔥
        </button>
      </motion.div>
    </motion.div>
  );
}
