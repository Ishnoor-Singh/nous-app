"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { motion } from "framer-motion";
import { 
  User, Flame, Brain, Settings, 
  LogOut, Trophy, BookOpen, Map,
  Swords, ChevronRight
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
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

  return (
    <main className="min-h-dvh p-6 safe-top">
      {/* Profile Header */}
      <motion.section
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="relative inline-block mb-4">
          {user?.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt="Profile"
              width={96}
              height={96}
              className="rounded-full"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Streak badge */}
          {stats && stats.currentStreak > 0 && (
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
              {stats.currentStreak}
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold">{userData.user.name || "Explorer"}</h1>
        <p className="text-sm text-muted-foreground">{userData.user.email}</p>
      </motion.section>

      {/* Nous's current state */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          How Nous feels about you
        </h2>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20">
          <p className="text-foreground leading-relaxed">
            {mood?.summary || "Still getting to know you..."}
          </p>
          
          {userData.emotionalState && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              <MiniStat label="Connection" value={userData.emotionalState.connection} />
              <MiniStat label="Curiosity" value={userData.emotionalState.curiosity} />
              <MiniStat label="Energy" value={userData.emotionalState.energy} />
              <MiniStat label="Mood" value={(userData.emotionalState.valence + 1) / 2} />
            </div>
          )}
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-accent" />
          Your Journey
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-muted text-center">
            <p className="text-2xl font-bold">{stats?.currentStreak || 0}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="p-4 rounded-2xl bg-muted text-center">
            <p className="text-2xl font-bold">{stats?.longestStreak || 0}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
          <div className="p-4 rounded-2xl bg-muted text-center">
            <p className="text-2xl font-bold">{stats?.totalCardsCompleted || 0}</p>
            <p className="text-xs text-muted-foreground">Explored</p>
          </div>
        </div>
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4">More</h2>
        <div className="space-y-2">
          <ProfileLink href="/challenge" icon={<Swords />} label="Daily Challenge" desc="Test your knowledge" />
          <ProfileLink href="/achievements" icon={<Trophy />} label="Achievements" desc="Your milestones" />
          <ProfileLink href="/library" icon={<BookOpen />} label="Library" desc="Topics & history" />
          <ProfileLink href="/paths" icon={<Map />} label="Learning Paths" desc="Guided journeys" />
          <ProfileLink href="/settings" icon={<Settings />} label="Settings" desc="App preferences" />
        </div>
      </motion.section>

      {/* Sign Out */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <SignOutButton>
          <button className="w-full p-4 rounded-2xl bg-muted flex items-center gap-3 text-red-500 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </SignOutButton>
      </motion.section>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="h-1 bg-secondary rounded-full overflow-hidden mb-1">
        <div 
          className="h-full bg-accent transition-all"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfileLink({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link href={href}>
      <div className="w-full p-4 rounded-2xl bg-muted flex items-center gap-3 hover:bg-secondary transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </Link>
  );
}
