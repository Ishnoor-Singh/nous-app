"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Flame, BookOpen, MessageCircle, 
  Sparkles, ChevronRight, Palette, Scale, 
  Clock, Globe, Heart
} from "lucide-react";
import Link from "next/link";

const TOPIC_CONFIG = {
  philosophy: { icon: Brain, color: "topic-philosophy", label: "Philosophy" },
  history: { icon: Clock, color: "topic-history", label: "History" },
  economics: { icon: Scale, color: "topic-economics", label: "Economics" },
  art: { icon: Palette, color: "topic-art", label: "Art" },
  psychology: { icon: Heart, color: "topic-psychology", label: "Psychology" },
};

export default function HomePage() {
  const { user } = useUser();
  const router = useRouter();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });
  const stats = useQuery(api.knowledge.getStats, {
    userId: userData?.user?._id || ("" as any),
  });
  const todayCards = useQuery(api.knowledge.getTodayCards, {
    userId: userData?.user?._id || ("" as any),
  });
  const generateCards = useMutation(api.knowledge.generateDailyCards);
  const syncUser = useMutation(api.users.syncUser);

  const [greeting, setGreeting] = useState("");

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (userData?.user && userData?.learningProgress && !userData.learningProgress.preferredStyle) {
      router.push("/onboarding");
    }
  }, [userData, router]);

  // Sync user on first load
  useEffect(() => {
    if (user && !userData?.user) {
      syncUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || user.firstName || undefined,
        imageUrl: user.imageUrl || undefined,
      });
    }
  }, [user, userData, syncUser]);

  // Generate cards if needed
  useEffect(() => {
    if (userData?.user && todayCards?.length === 0) {
      generateCards({ userId: userData.user._id });
    }
  }, [userData, todayCards, generateCards]);

  // Dynamic greeting based on emotional state
  useEffect(() => {
    if (!userData?.emotionalState) {
      setGreeting("Hello");
      return;
    }

    const { valence, connection, curiosity } = userData.emotionalState;
    
    if (connection > 0.6) {
      setGreeting(valence > 0.3 ? "Great to see you again!" : "I've missed you");
    } else if (curiosity > 0.6) {
      setGreeting("Ready to explore something new?");
    } else if (valence > 0.3) {
      setGreeting("Feeling good today");
    } else {
      setGreeting("Welcome back");
    }
  }, [userData?.emotionalState]);

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const emotionalState = userData.emotionalState;
  const firstName = userData.user.name?.split(" ")[0] || "friend";

  return (
    <main className="min-h-dvh p-6 safe-top safe-bottom">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <p className="text-muted-foreground text-sm">{greeting}</p>
          <h1 className="text-2xl font-bold">{firstName}</h1>
        </div>
        
        {/* Emotional state indicator */}
        <EmotionOrb state={emotionalState} />
      </motion.header>

      {/* Streak Banner */}
      {stats && stats.currentStreak > 0 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold">{stats.currentStreak} day streak!</p>
            <p className="text-sm text-muted-foreground">
              {stats.totalCardsCompleted} cards explored
            </p>
          </div>
        </motion.div>
      )}

      {/* Today's Discoveries */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Today's Discoveries
          </h2>
          <span className="text-sm text-muted-foreground">
            {todayCards?.filter(c => c.completed).length || 0}/3
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {todayCards?.map((card, index) => {
              const config = TOPIC_CONFIG[card.topic as keyof typeof TOPIC_CONFIG];
              const Icon = config?.icon || BookOpen;

              return (
                <motion.div
                  key={card._id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/explore/${card._id}`}>
                    <div
                      className={`p-4 rounded-2xl ${config?.color || "bg-muted"} text-white relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform`}
                    >
                      {card.completed && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          ✓
                        </div>
                      )}
                      <Icon className="w-8 h-8 mb-2 opacity-80" />
                      <p className="font-semibold">{config?.label || card.topic}</p>
                      <p className="text-sm opacity-80 mt-1">
                        {card.completed ? card.title : "Tap to explore"}
                      </p>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* Quick Chat */}
      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-accent" />
          Continue Learning
        </h2>

        <Link href="/chat">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-5 rounded-2xl bg-muted border border-secondary hover:border-accent/30 transition-colors cursor-pointer"
          >
            <p className="text-muted-foreground">
              Ask me anything about philosophy, history, economics, art, or psychology...
            </p>
          </motion.div>
        </Link>
      </section>

      {/* Bottom nav will go here */}
    </main>
  );
}

function EmotionOrb({ state }: { state: any }) {
  if (!state) return null;

  // Determine dominant emotion color
  let emotionClass = "emotion-neutral";
  if (state.valence > 0.3) emotionClass = "emotion-positive";
  else if (state.valence < -0.3) emotionClass = "emotion-negative";
  else if (state.arousal > 0.6) emotionClass = "emotion-excited";
  else if (state.curiosity > 0.6) emotionClass = "emotion-curious";
  else if (state.connection > 0.6) emotionClass = "emotion-connected";

  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={`w-12 h-12 rounded-full bg-gradient-to-br from-accent to-purple-600 emotion-ring ${emotionClass} flex items-center justify-center`}
    >
      <Brain className="w-6 h-6 text-white" />
    </motion.div>
  );
}
