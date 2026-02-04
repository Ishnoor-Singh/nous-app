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
  Clock, Heart, Target, Check, ListTodo
} from "lucide-react";
import Link from "next/link";
import { QuickCapture } from "@/components/QuickCapture";

const TOPIC_CONFIG = {
  philosophy: { icon: Brain, color: "topic-philosophy", label: "Philosophy", emoji: "🤔" },
  history: { icon: Clock, color: "topic-history", label: "History", emoji: "📜" },
  economics: { icon: Scale, color: "topic-economics", label: "Economics", emoji: "📈" },
  art: { icon: Palette, color: "topic-art", label: "Art", emoji: "🎨" },
  psychology: { icon: Heart, color: "topic-psychology", label: "Psychology", emoji: "🧠" },
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
  const habitProgress = useQuery(api.habits.getTodayProgress, {
    userId: userData?.user?._id || ("" as any),
  });
  const generateCards = useMutation(api.knowledge.generateDailyCards);
  const syncUser = useMutation(api.users.syncUser);
  const createTodo = useMutation(api.todos.createTodo);

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

  // Dynamic greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const emotionalState = userData.emotionalState;
  const firstName = userData.user.name?.split(" ")[0] || "friend";
  const completedHabits = habitProgress?.filter(h => h.isCompletedToday).length || 0;
  const totalHabits = habitProgress?.length || 0;

  // Handle quick capture
  const handleQuickCapture = async (input: string, parsed?: any) => {
    if (!userData?.user) return;
    
    await createTodo({
      userId: userData.user._id,
      title: parsed?.title || input,
      priority: parsed?.priority || undefined,
      dueDate: parsed?.dueDate || undefined,
      dueTime: parsed?.dueTime || undefined,
    });
  };

  return (
    <main className="min-h-dvh p-6 safe-top">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <p className="text-white/50 text-sm">{greeting}</p>
          <h1 className="text-3xl font-bold text-white text-glow">{firstName}</h1>
        </div>
        
        {/* Emotional state orb */}
        <EmotionOrb state={emotionalState} />
      </motion.header>

      {/* Streak Banner */}
      {stats && stats.currentStreak > 0 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 p-4 rounded-2xl glass-card glass-warning flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center glow-warning">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">{stats.currentStreak} day streak! 🔥</p>
            <p className="text-sm text-white/60">
              {stats.totalCardsCompleted} cards explored total
            </p>
          </div>
        </motion.div>
      )}

      {/* Today's Habits */}
      {habitProgress && habitProgress.length > 0 && (
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Today's Habits
            </h2>
            <Link href="/habits" className="text-sm text-accent hover:text-accent/80 transition-colors">
              See all →
            </Link>
          </div>
          
          <div className="glass-card p-4">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {habitProgress.slice(0, 4).map((habit, index) => (
                <motion.div
                  key={habit._id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-xl text-center transition-all ${
                    habit.isCompletedToday
                      ? "glass-accent glow-accent"
                      : "glass-button"
                  }`}
                >
                  <span className="text-2xl">{habit.icon || "✨"}</span>
                  {habit.isCompletedToday && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex justify-center mt-1"
                    >
                      <Check className="w-4 h-4 text-accent" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Progress bar */}
            <div className="progress-glass h-2">
              <motion.div
                className="progress-glass-fill h-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completedHabits / totalHabits) * 100}%` }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-white/50 mt-2 text-center">
              {completedHabits} of {totalHabits} completed
            </p>
          </div>
        </motion.section>
      )}

      {/* Quick Capture */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-accent" />
            Quick Capture
          </h2>
          <Link href="/tasks" className="text-sm text-accent hover:text-accent/80 transition-colors">
            View all →
          </Link>
        </div>
        
        <QuickCapture 
          onCapture={handleQuickCapture}
          placeholder="Add a task... 'Call mom tomorrow at 3pm'"
        />
      </motion.section>

      {/* Today's Discoveries */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Today's Discoveries
          </h2>
          <span className="text-sm text-white/50 glass-button px-3 py-1 rounded-full">
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
                      className={`p-5 rounded-2xl glass-card ${config?.color || ""} backdrop-blur-xl relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all duration-300 hover:scale-[1.02]`}
                    >
                      {card.completed && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full glass-success flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-green-400" />
                        </motion.div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{config?.emoji}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-lg">{config?.label || card.topic}</p>
                          <p className="text-sm text-white/60 mt-1">
                            {card.completed ? card.title : "Tap to explore →"}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
                      </div>
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
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-accent" />
          Ask Nous Anything
        </h2>

        <Link href="/chat">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card glass-card-hover p-5 cursor-pointer"
          >
            <p className="text-white/50">
              Philosophy, history, economics, art, psychology... or share a YouTube video! 📺
            </p>
          </motion.div>
        </Link>
      </section>
    </main>
  );
}

function EmotionOrb({ state }: { state: any }) {
  // Determine dominant emotion color
  let emotionClass = "emotion-neutral";
  let glowColor = "rgba(163, 163, 163, 0.3)";
  
  if (state) {
    if (state.valence > 0.3) {
      emotionClass = "emotion-positive";
      glowColor = "rgba(34, 197, 94, 0.4)";
    } else if (state.valence < -0.3) {
      emotionClass = "emotion-negative";
      glowColor = "rgba(239, 68, 68, 0.4)";
    } else if (state.arousal > 0.6) {
      emotionClass = "emotion-excited";
      glowColor = "rgba(245, 158, 11, 0.4)";
    } else if (state.curiosity > 0.6) {
      emotionClass = "emotion-curious";
      glowColor = "rgba(139, 92, 246, 0.4)";
    } else if (state.connection > 0.6) {
      emotionClass = "emotion-connected";
      glowColor = "rgba(236, 72, 153, 0.4)";
    }
  }

  return (
    <motion.div
      animate={{ 
        scale: [1, 1.05, 1],
        boxShadow: [
          `0 0 20px ${glowColor}`,
          `0 0 40px ${glowColor}`,
          `0 0 20px ${glowColor}`,
        ]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={`w-14 h-14 rounded-full bg-gradient-to-br from-accent to-purple-600 emotion-ring ${emotionClass} flex items-center justify-center`}
    >
      <Brain className="w-7 h-7 text-white" />
    </motion.div>
  );
}
