"use client";

import { motion } from "framer-motion";
import { Brain, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      {/* Animated brain */}
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/50 to-purple-600/50 flex items-center justify-center mb-8"
      >
        <Brain className="w-12 h-12 text-accent" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-4"
      >
        Lost in thought
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground mb-8 max-w-xs"
      >
        I couldn't find what you're looking for. Maybe it wandered off to explore some philosophy.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-muted rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>

        <Link
          href="/home"
          className="px-6 py-3 bg-accent text-accent-foreground rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors"
        >
          <Home className="w-4 h-4" />
          Go home
        </Link>
      </motion.div>
    </main>
  );
}
