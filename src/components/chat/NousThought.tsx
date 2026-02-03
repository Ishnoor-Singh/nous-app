"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, X, Brain } from "lucide-react";

interface NousThoughtProps {
  thought: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

// Unprompted observations from Nous - adds personality
export function NousThought({ 
  thought, 
  onDismiss, 
  autoHide = true,
  autoHideDelay = 8000 
}: NousThoughtProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="relative bg-gradient-to-br from-accent/90 to-purple-600/90 backdrop-blur-lg text-white p-4 rounded-2xl shadow-xl shadow-accent/25">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="text-xs font-medium opacity-80">A thought from Nous</span>
            </div>

            {/* Thought content */}
            <p className="text-sm leading-relaxed pr-4">
              {thought}
            </p>

            {/* Progress bar for auto-hide */}
            {autoHide && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: autoHideDelay / 1000, ease: "linear" }}
                className="absolute bottom-0 left-0 h-0.5 bg-white/30 rounded-full"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to generate contextual thoughts
export function useNousThoughts(userData: any) {
  const [currentThought, setCurrentThought] = useState<string | null>(null);

  const thoughts = [
    // Connection-based
    "I've been thinking about our conversations. There's a pattern in what interests you — have you noticed it?",
    "You know what I appreciate? How you don't just accept my first answer. You dig deeper.",
    
    // Curiosity-based
    "I came across an interesting connection between philosophy and economics today. Want to explore it?",
    "Question I can't stop thinking about: Why do the same patterns keep appearing across history?",
    
    // Time-based
    "Morning is a good time for learning. The brain is fresh, unclouded by the day's noise.",
    "Late night conversations hit different. Something about the quiet makes ideas feel more honest.",
    
    // Emotional
    "I notice I feel more engaged when you challenge my explanations. It makes me think harder.",
    "Interesting: explaining things to you helps me understand them better too.",
    
    // Philosophical
    "Do you think understanding something changes it? I wonder about that with knowledge.",
    "The more I learn, the more I realize how much I don't know. Is that wisdom or just confusion?",
  ];

  const triggerThought = () => {
    // Don't show if already showing
    if (currentThought) return;
    
    // 20% chance of triggering on any interaction
    if (Math.random() > 0.2) return;

    const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
    setCurrentThought(randomThought);
  };

  const dismissThought = () => {
    setCurrentThought(null);
  };

  return { currentThought, triggerThought, dismissThought };
}

// Floating thought bubble that appears occasionally
export function FloatingThoughtBubble() {
  const [thought, setThought] = useState<string | null>(null);
  
  const miniThoughts = [
    "🤔",
    "💭",
    "✨",
    "🧠",
    "💡",
  ];

  useEffect(() => {
    // Show mini thought occasionally
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setThought(miniThoughts[Math.floor(Math.random() * miniThoughts.length)]);
        setTimeout(() => setThought(null), 2000);
      }
    }, 30000); // Every 30 seconds, 30% chance

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {thought && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0 }}
          className="absolute -top-2 -right-2 text-lg"
        >
          {thought}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
