"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Flame, Plus, Target, Trophy, Sparkles, 
  Dumbbell, Droplets, BookOpen, Camera, Apple, Wine
} from "lucide-react";

// Placeholder page until Convex schema is pushed
// Run `npx convex dev` locally to enable habit tracking

export default function HabitsPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // Preview of 75 Hard habits
  const previewHabits = [
    { name: "Follow diet", icon: "🥗", completed: false },
    { name: "Workout #1", icon: "🏋️", completed: false },
    { name: "Workout #2", icon: "🏃", completed: false },
    { name: "Drink water", icon: "💧", completed: false },
    { name: "Read 10 pages", icon: "📚", completed: false },
    { name: "Progress photo", icon: "📸", completed: false },
    { name: "No alcohol", icon: "🚫", completed: false },
  ];

  return (
    <main className="min-h-dvh p-6 safe-top safe-bottom">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-7 h-7 text-accent" />
          Daily Habits
        </h1>
        <p className="text-muted-foreground mt-1">Build consistency, one day at a time</p>
      </motion.header>

      {/* Coming Soon Banner */}
      <motion.section
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-xl font-bold mb-2">Coming Soon!</h2>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Habit tracking is being set up. You'll soon be able to track 75 Hard, custom habits, and more!
        </p>
      </motion.section>

      {/* 75 Hard Preview */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">75 Hard Challenge</h2>
        </div>
        
        <div className="p-4 rounded-2xl bg-muted mb-4">
          <p className="text-sm text-muted-foreground mb-3">
            The ultimate mental toughness program. 75 days, no excuses, no substitutions.
          </p>
          
          <div className="space-y-2">
            {previewHabits.map((habit, index) => (
              <motion.div
                key={habit.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-background/50"
              >
                <span className="text-xl">{habit.icon}</span>
                <span className="font-medium">{habit.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Nous will check in daily to keep you accountable 💪
        </p>
      </section>

      {/* Proactive Features Preview */}
      <section>
        <h2 className="text-lg font-semibold mb-4">What's Coming</h2>
        <div className="grid grid-cols-2 gap-3">
          <FeatureCard 
            icon={<Flame className="w-6 h-6 text-orange-500" />}
            title="Streak Tracking"
            desc="Build momentum"
          />
          <FeatureCard 
            icon={<Target className="w-6 h-6 text-blue-500" />}
            title="Custom Habits"
            desc="Your goals, your way"
          />
          <FeatureCard 
            icon={<Sparkles className="w-6 h-6 text-purple-500" />}
            title="Nous Check-ins"
            desc="Daily accountability"
          />
          <FeatureCard 
            icon={<Trophy className="w-6 h-6 text-yellow-500" />}
            title="Achievements"
            desc="Celebrate wins"
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-4 rounded-2xl bg-muted">
      <div className="mb-2">{icon}</div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
