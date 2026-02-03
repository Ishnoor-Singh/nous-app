"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";

interface EmotionalState {
  valence: number;
  arousal: number;
  connection: number;
  curiosity: number;
  energy: number;
}

interface EmotionalOrbProps {
  state: EmotionalState | null;
  size?: "sm" | "md" | "lg";
  showPulse?: boolean;
  onClick?: () => void;
}

export function EmotionalOrb({ 
  state, 
  size = "md", 
  showPulse = true,
  onClick 
}: EmotionalOrbProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  // Determine dominant emotion and corresponding color
  const getEmotionColor = () => {
    if (!state) return { from: "from-gray-400", to: "to-gray-500", glow: "rgba(156, 163, 175, 0.4)" };

    const { valence, arousal, connection, curiosity, energy } = state;

    // Priority: connection > curiosity > valence > arousal
    if (connection > 0.6) {
      return { from: "from-pink-500", to: "to-rose-600", glow: "rgba(236, 72, 153, 0.4)" };
    }
    if (curiosity > 0.6) {
      return { from: "from-purple-500", to: "to-violet-600", glow: "rgba(139, 92, 246, 0.4)" };
    }
    if (valence > 0.3) {
      return { from: "from-emerald-500", to: "to-green-600", glow: "rgba(34, 197, 94, 0.4)" };
    }
    if (valence < -0.3) {
      return { from: "from-blue-500", to: "to-indigo-600", glow: "rgba(59, 130, 246, 0.4)" };
    }
    if (arousal > 0.6) {
      return { from: "from-amber-500", to: "to-orange-600", glow: "rgba(245, 158, 11, 0.4)" };
    }
    
    // Default: accent color
    return { from: "from-accent", to: "to-purple-600", glow: "rgba(99, 102, 241, 0.4)" };
  };

  const colors = getEmotionColor();

  // Animation intensity based on arousal
  const pulseIntensity = state ? 1 + (state.arousal * 0.2) : 1.05;

  return (
    <motion.div
      onClick={onClick}
      animate={showPulse ? {
        scale: [1, pulseIntensity, 1],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center cursor-pointer`}
      style={{
        boxShadow: `0 0 20px ${colors.glow}`,
      }}
    >
      <Brain className={`${iconSizes[size]} text-white`} />
    </motion.div>
  );
}

// Floating orbs background effect
export function EmotionalAmbience({ state }: { state: EmotionalState | null }) {
  if (!state) return null;

  const colors = [];
  
  if (state.valence > 0.3) colors.push("bg-emerald-500/10");
  if (state.valence < -0.3) colors.push("bg-blue-500/10");
  if (state.connection > 0.5) colors.push("bg-pink-500/10");
  if (state.curiosity > 0.5) colors.push("bg-purple-500/10");
  if (state.arousal > 0.5) colors.push("bg-amber-500/10");
  
  if (colors.length === 0) colors.push("bg-accent/5");

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {colors.map((color, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8 + index * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.5,
          }}
          className={`absolute w-96 h-96 ${color} rounded-full blur-3xl`}
          style={{
            top: `${20 + (index * 25)}%`,
            left: `${10 + (index * 30)}%`,
          }}
        />
      ))}
    </div>
  );
}
