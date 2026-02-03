"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Brain, Trophy, Clock, Zap } from "lucide-react";
import { useState } from "react";
import { DailyChallenge, SAMPLE_QUESTIONS } from "@/components/knowledge/DailyChallenge";

export default function ChallengePage() {
  const { user } = useUser();
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);

  const handleComplete = (finalScore: number) => {
    setScore(finalScore);
    setIsComplete(true);
  };

  if (!hasStarted) {
    return (
      <main className="min-h-dvh p-6 safe-top flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold">Daily Challenge</h1>
          <p className="text-muted-foreground">Test your knowledge</p>
        </motion.div>

        {/* Challenge Preview */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-8 shadow-2xl shadow-amber-500/25"
          >
            <Brain className="w-12 h-12 text-white" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold mb-4"
          >
            Ready to test yourself?
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mb-8 max-w-xs"
          >
            {SAMPLE_QUESTIONS.length} questions across philosophy, economics, and psychology. Let's see what you've learned!
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-4 mb-8 w-full max-w-xs"
          >
            <div className="p-3 rounded-2xl bg-muted text-center">
              <Zap className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <p className="text-sm text-muted-foreground">Quick</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted text-center">
              <Brain className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <p className="text-sm text-muted-foreground">3 topics</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-sm text-muted-foreground">Rewards</p>
            </div>
          </motion.div>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setHasStarted(true)}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
          >
            Start Challenge
          </motion.button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 safe-top">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Daily Challenge</h1>
      </motion.div>

      {/* Challenge Component */}
      <DailyChallenge 
        questions={SAMPLE_QUESTIONS} 
        onComplete={handleComplete}
      />
    </main>
  );
}
