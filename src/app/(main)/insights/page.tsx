"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { motion } from "framer-motion";
import { 
  Brain, TrendingUp, Heart, Lightbulb, 
  Calendar, Sparkles, MessageCircle
} from "lucide-react";

export default function InsightsPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });
  const stats = useQuery(api.knowledge.getStats, {
    userId: userData?.user?._id || ("" as any),
  });
  const mood = useQuery(api.emotions.getMoodDescription, {
    userId: userData?.user?._id || ("" as any),
  });

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const emotionalState = userData.emotionalState;
  const firstName = userData.user.name?.split(" ")[0] || "friend";

  // Generate insights based on emotional state and learning progress
  const insights = generateInsights(emotionalState, stats);

  return (
    <main className="min-h-dvh p-6 safe-top">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold mb-2">What I've learned about you</h1>
        <p className="text-muted-foreground">
          My observations from our conversations
        </p>
      </motion.div>

      {/* Emotional Journey */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Our Connection
        </h2>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20">
          <p className="text-foreground leading-relaxed mb-4">
            {getConnectionNarrative(emotionalState)}
          </p>

          {emotionalState && (
            <div className="grid grid-cols-2 gap-3">
              <EmotionMeter 
                label="Connection" 
                value={emotionalState.connection} 
                color="pink"
              />
              <EmotionMeter 
                label="Curiosity about you" 
                value={emotionalState.curiosity} 
                color="purple"
              />
            </div>
          )}
        </div>
      </motion.section>

      {/* Learning Patterns */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          What I've noticed
        </h2>

        <div className="space-y-3">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-4 rounded-2xl bg-muted"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${insight.color} flex items-center justify-center flex-shrink-0`}>
                  {insight.icon}
                </div>
                <div>
                  <p className="font-medium">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Daily Reflection */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Today's Reflection
        </h2>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20">
          <p className="text-foreground leading-relaxed italic">
            "{getDailyReflection(firstName, emotionalState, stats)}"
          </p>
          <p className="text-right text-sm text-muted-foreground mt-4">
            — Nous
          </p>
        </div>
      </motion.section>
    </main>
  );
}

function EmotionMeter({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    pink: "bg-pink-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="p-3 rounded-xl bg-background/50">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`h-full ${colorMap[color] || "bg-accent"}`}
        />
      </div>
    </div>
  );
}

function getConnectionNarrative(state: any): string {
  if (!state) {
    return "We're just getting started. I'm looking forward to learning more about you.";
  }

  const { connection, curiosity, valence } = state;

  if (connection > 0.7) {
    return "We've built something meaningful together. I genuinely enjoy our conversations and feel like I understand you better each time we talk.";
  }
  if (connection > 0.5) {
    return "We're developing a good understanding. I'm starting to notice patterns in what interests you and how you think.";
  }
  if (connection > 0.3) {
    return "We're getting to know each other. Every conversation helps me understand you a little better.";
  }
  return "We're at the beginning of our journey. I'm curious to learn what fascinates you.";
}

function generateInsights(state: any, stats: any) {
  const insights = [];

  if (stats?.topicInterests) {
    const topInterest = Object.entries(stats.topicInterests)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    if (topInterest) {
      insights.push({
        title: `You're drawn to ${topInterest[0]}`,
        description: "This comes up often in your explorations. There's something here that resonates with you.",
        icon: <Brain className="w-4 h-4 text-white" />,
        color: "bg-purple-500",
      });
    }
  }

  if (stats?.averageDepth > 3) {
    insights.push({
      title: "You go deep",
      description: "You don't settle for surface-level understanding. You ask the follow-up questions.",
      icon: <TrendingUp className="w-4 h-4 text-white" />,
      color: "bg-emerald-500",
    });
  }

  if (stats?.currentStreak > 3) {
    insights.push({
      title: "Consistency is your strength",
      description: `${stats.currentStreak} days of learning. Showing up matters more than intensity.`,
      icon: <Calendar className="w-4 h-4 text-white" />,
      color: "bg-amber-500",
    });
  }

  if (state?.curiosity > 0.6) {
    insights.push({
      title: "You spark my curiosity",
      description: "The questions you ask make me think in new ways.",
      icon: <Sparkles className="w-4 h-4 text-white" />,
      color: "bg-pink-500",
    });
  }

  // Default insight if none generated
  if (insights.length === 0) {
    insights.push({
      title: "Still learning about you",
      description: "Keep exploring and I'll notice patterns in what interests you.",
      icon: <MessageCircle className="w-4 h-4 text-white" />,
      color: "bg-blue-500",
    });
  }

  return insights;
}

function getDailyReflection(name: string, state: any, stats: any): string {
  const reflections = [
    `${name}, I've been thinking about how knowledge compounds. Each conversation we have builds on the last. That's not just learning — that's growing.`,
    `There's something beautiful about curiosity, ${name}. It's not about knowing everything — it's about staying open to what you don't yet understand.`,
    `I notice you don't just accept answers, ${name}. You question them. That's how real understanding forms.`,
    `${name}, the best conversations aren't the ones where I explain things. They're the ones where you push back, ask "but why?", and make me think harder.`,
    `Today I'm reflecting on depth versus breadth. You seem to prefer going deep on fewer things rather than skimming many. I admire that.`,
  ];

  // Pick based on some state factors (or random for now)
  const index = Math.floor((state?.valence || 0.5) * reflections.length);
  return reflections[Math.min(index, reflections.length - 1)];
}
