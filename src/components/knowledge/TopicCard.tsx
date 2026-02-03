"use client";

import { motion } from "framer-motion";
import { ChevronRight, Brain, Clock, Scale, Palette, Heart, BookOpen } from "lucide-react";
import Link from "next/link";

const TOPIC_CONFIG: Record<string, { icon: any; gradient: string; label: string }> = {
  philosophy: { icon: Brain, gradient: "from-purple-500 to-violet-600", label: "Philosophy" },
  history: { icon: Clock, gradient: "from-amber-500 to-orange-600", label: "History" },
  economics: { icon: Scale, gradient: "from-emerald-500 to-green-600", label: "Economics" },
  art: { icon: Palette, gradient: "from-pink-500 to-rose-600", label: "Art" },
  psychology: { icon: Heart, gradient: "from-blue-500 to-indigo-600", label: "Psychology" },
};

interface TopicCardProps {
  cardId: string;
  topic: string;
  title?: string;
  completed?: boolean;
  depth?: number;
  index?: number;
}

export function TopicCard({ cardId, topic, title, completed, depth, index = 0 }: TopicCardProps) {
  const config = TOPIC_CONFIG[topic] || { icon: BookOpen, gradient: "from-gray-500 to-gray-600", label: topic };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/explore/${cardId}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative p-5 rounded-2xl bg-gradient-to-br ${config.gradient} text-white overflow-hidden cursor-pointer`}
        >
          {/* Completed indicator */}
          {completed && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
            >
              <span className="text-sm">✓</span>
            </motion.div>
          )}

          {/* Depth indicator */}
          {completed && depth && (
            <div className="absolute top-3 right-12 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-1.5 h-3 rounded-full ${
                    level <= depth ? "bg-white/80" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Background decoration */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
          
          {/* Content */}
          <Icon className="w-8 h-8 mb-3 opacity-90" />
          <p className="font-semibold text-lg">{config.label}</p>
          <p className="text-sm opacity-80 mt-1">
            {completed ? (title || "Completed") : "Tap to explore"}
          </p>

          {/* Arrow */}
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Compact version for lists
export function TopicCardCompact({ topic, label, onClick }: { topic: string; label?: string; onClick?: () => void }) {
  const config = TOPIC_CONFIG[topic] || { icon: BookOpen, gradient: "from-gray-500 to-gray-600", label: topic };
  const Icon = config.icon;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl bg-gradient-to-r ${config.gradient} text-white text-sm font-medium flex items-center gap-2`}
    >
      <Icon className="w-4 h-4" />
      <span>{label || config.label}</span>
    </motion.button>
  );
}
