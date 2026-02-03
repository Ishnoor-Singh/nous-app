"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { motion } from "framer-motion";
import { 
  Brain, Clock, Scale, Palette, Heart, 
  BookOpen, TrendingUp, Filter
} from "lucide-react";
import { useState } from "react";

const TOPIC_CONFIG = {
  philosophy: { icon: Brain, color: "bg-purple-500", label: "Philosophy" },
  history: { icon: Clock, color: "bg-amber-500", label: "History" },
  economics: { icon: Scale, color: "bg-emerald-500", label: "Economics" },
  art: { icon: Palette, color: "bg-pink-500", label: "Art" },
  psychology: { icon: Heart, color: "bg-blue-500", label: "Psychology" },
};

export default function LibraryPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });
  const stats = useQuery(api.knowledge.getStats, {
    userId: userData?.user?._id || ("" as any),
  });

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-dvh p-6 safe-top">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-2xl font-bold mb-6">Your Library</h1>
      </motion.div>

      {/* Stats Overview */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-8"
      >
        <StatCard 
          icon={<BookOpen className="w-5 h-5" />}
          label="Cards Explored"
          value={stats?.totalCardsCompleted || 0}
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg Depth"
          value={`${(stats?.averageDepth || 0).toFixed(1)}/5`}
        />
      </motion.section>

      {/* Topic Interests */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-accent" />
          Your Interests
        </h2>

        <div className="space-y-3">
          {Object.entries(TOPIC_CONFIG).map(([key, config]) => {
            const interest = stats?.topicInterests?.[key as keyof typeof stats.topicInterests] || 0.5;
            const Icon = config.icon;

            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTopic(selectedTopic === key ? null : key)}
                className={`p-4 rounded-2xl bg-muted cursor-pointer transition-all ${
                  selectedTopic === key ? "ring-2 ring-accent" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{config.label}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(interest * 100)}%
                  </span>
                </div>
                
                {/* Interest bar */}
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${interest * 100}%` }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className={`h-full ${config.color}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Coming Soon: Saved concepts, mastered topics, etc. */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">
          Your saved concepts and mastered topics will appear here as you explore.
        </p>
      </motion.section>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-2xl bg-muted">
      <div className="text-accent mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
