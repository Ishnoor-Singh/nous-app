"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, Sparkles, Calendar, PenLine,
  ChevronRight, Flame, MessageCircle
} from "lucide-react";
import Link from "next/link";

// Placeholder page until Convex schema is pushed
// Run `npx convex dev` locally to enable journaling

export default function JournalPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });

  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // Preview prompts
  const prompts = [
    { category: "reflection", text: "What's one thing you learned about yourself today?", icon: "🪞" },
    { category: "gratitude", text: "What are three things you're grateful for right now?", icon: "🙏" },
    { category: "growth", text: "In what small way did you grow today?", icon: "🌱" },
    { category: "intention", text: "What do you want tomorrow to look like?", icon: "🎯" },
  ];

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <main className="min-h-dvh p-6 safe-top safe-bottom">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <p className="text-muted-foreground text-sm">{today}</p>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-accent" />
          Journal
        </h1>
      </motion.header>

      {/* Coming Soon Banner */}
      <motion.section
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <PenLine className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">AI-Assisted Journaling</h2>
            <p className="text-sm text-muted-foreground">
              Nous helps you reflect with thoughtful prompts, tracks themes across your entries, and offers gentle insights.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Writing Prompts */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Today's Prompts
        </h2>
        
        <div className="space-y-3">
          {prompts.map((prompt, index) => (
            <motion.button
              key={prompt.category}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedPrompt(prompt.text)}
              className={`w-full p-4 rounded-2xl text-left transition-all ${
                selectedPrompt === prompt.text
                  ? "bg-accent/10 ring-2 ring-accent"
                  : "bg-muted hover:bg-secondary"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{prompt.icon}</span>
                <p className="flex-1 text-sm">{prompt.text}</p>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Preview Journal Entry */}
      {selectedPrompt && (
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="p-4 rounded-2xl bg-muted">
            <p className="text-sm text-muted-foreground mb-3">{selectedPrompt}</p>
            <textarea
              placeholder="Start writing..."
              className="w-full h-32 bg-transparent resize-none focus:outline-none text-foreground"
              disabled
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              Coming soon — journal entries will be saved and analyzed by Nous
            </p>
          </div>
        </motion.section>
      )}

      {/* Features Preview */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">What's Coming</h2>
        <div className="grid grid-cols-2 gap-3">
          <FeatureCard 
            icon={<MessageCircle className="w-6 h-6 text-purple-500" />}
            title="AI Reflections"
            desc="Nous responds thoughtfully"
          />
          <FeatureCard 
            icon={<Calendar className="w-6 h-6 text-blue-500" />}
            title="Daily Streaks"
            desc="Build the habit"
          />
          <FeatureCard 
            icon={<Sparkles className="w-6 h-6 text-amber-500" />}
            title="Theme Tracking"
            desc="Patterns over time"
          />
          <FeatureCard 
            icon={<Flame className="w-6 h-6 text-orange-500" />}
            title="Mood Insights"
            desc="Emotional awareness"
          />
        </div>
      </section>

      {/* Chat CTA */}
      <Link href="/chat">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-accent to-purple-600 text-white"
        >
          <p className="font-semibold mb-1">Talk to Nous instead</p>
          <p className="text-sm opacity-80">
            Not ready to write? Have a conversation and process your thoughts that way.
          </p>
        </motion.div>
      </Link>
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
