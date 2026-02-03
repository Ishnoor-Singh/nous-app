"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { motion } from "framer-motion";
import { LogOut, Settings, BookOpen, Trophy, Inbox, ChevronRight, Flame, User } from "lucide-react";
import Link from "next/link";
import { TactileCard, TactileBadge } from "@/components/tactile/TactileElements";

export default function ProfilePage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });
  const stats = useQuery(api.knowledge.getStats, {
    userId: userData?.user?._id || ("" as any),
  });

  if (!userData?.user) {
    return (
      <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 48,
            height: 48,
            background: "linear-gradient(145deg, #c4956a, #b38656)",
            borderRadius: 14,
          }}
        />
      </div>
    );
  }

  const firstName = userData.user.name?.split(" ")[0] || "Explorer";

  return (
    <div style={{ padding: "20px 16px", maxWidth: 500, margin: "0 auto" }}>
      {/* Profile Card */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <TactileCard variant="floating" style={{ textAlign: "center", marginBottom: 24, padding: 28 }}>
          {/* Avatar */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: "linear-gradient(145deg, #c4956a, #b38656)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "6px 6px 20px rgba(196, 149, 106, 0.3), -3px -3px 12px rgba(255, 255, 255, 0.5)",
              overflow: "hidden",
            }}
          >
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt="" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />
            ) : (
              <User size={44} color="white" />
            )}
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#4a4035", margin: "0 0 4px 0" }}>
            {firstName}
          </h1>
          <p style={{ fontSize: 14, color: "#8a7b6d", margin: 0 }}>
            {userData.user.email}
          </p>

          {/* Streak Badge */}
          {stats && stats.currentStreak > 0 && (
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
              <TactileBadge color="warning">
                <Flame size={14} style={{ marginRight: 4 }} />
                {stats.currentStreak} day streak!
              </TactileBadge>
            </div>
          )}
        </TactileCard>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: 24 }}
      >
        <TactileCard>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <StatItem value={stats?.currentStreak || 0} label="Day Streak" color="#7d9b76" />
            <StatItem value={stats?.longestStreak || 0} label="Best Streak" color="#d4a574" />
            <StatItem value={stats?.totalCardsCompleted || 0} label="Explored" color="#7a99b5" />
          </div>
        </TactileCard>
      </motion.div>

      {/* Menu */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <TactileCard style={{ padding: 8 }}>
          <MenuLink href="/inbox" icon={<Inbox size={20} />} label="Inbox" desc="Saved media & notes" />
          <MenuLink href="/achievements" icon={<Trophy size={20} />} label="Achievements" desc="Your milestones" />
          <MenuLink href="/library" icon={<BookOpen size={20} />} label="Library" desc="Topics explored" />
          <MenuLink href="/settings" icon={<Settings size={20} />} label="Settings" desc="Preferences" />

          <div 
            style={{ 
              height: 1, 
              background: "linear-gradient(90deg, transparent, #e0d6c8, transparent)", 
              margin: "8px 16px" 
            }} 
          />

          <SignOutButton>
            <motion.button
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%",
                padding: "14px 20px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 16,
                color: "#c26b5e",
                borderRadius: 12,
              }}
            >
              <LogOut size={20} />
              Sign Out
            </motion.button>
          </SignOutButton>
        </TactileCard>
      </motion.div>
    </div>
  );
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: "#8a7b6d" }}>{label}</div>
    </div>
  );
}

function MenuLink({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <motion.div
        whileTap={{ scale: 0.98, background: "#f5efe5" }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 16px",
          borderRadius: 12,
        }}
      >
        <div 
          style={{ 
            color: "#8a7b6d",
            width: 40,
            height: 40,
            background: "#f5efe5",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#4a4035", margin: 0 }}>
            {label}
          </p>
          <p style={{ fontSize: 13, color: "#8a7b6d", margin: 0 }}>
            {desc}
          </p>
        </div>
        <ChevronRight size={20} style={{ color: "#c9bfb0" }} />
      </motion.div>
    </Link>
  );
}
