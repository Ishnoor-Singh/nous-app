"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { LogOut, Settings, BookOpen, Trophy, Inbox, ChevronRight, Flame } from "lucide-react";
import Link from "next/link";
import { TapeStrip, StickyNote, CoffeeStain, Doodle, PaperClip } from "@/components/paper/PaperElements";

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
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: "#666" }}>
          Loading...
        </p>
      </div>
    );
  }

  const firstName = userData.user.name?.split(" ")[0] || "Explorer";

  return (
    <div style={{ padding: "20px 16px", maxWidth: 500, margin: "0 auto", position: "relative" }}>
      {/* Profile card */}
      <div
        style={{
          background: "#f5f0e6",
          padding: "24px",
          marginBottom: 20,
          position: "relative",
          boxShadow: "3px 4px 12px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        <TapeStrip style={{ top: -8, left: 40 }} rotation={-3} color="peach" />
        <TapeStrip style={{ top: -6, right: 50 }} rotation={2} color="blue" />
        
        {/* Avatar */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            background: "#fff9c4",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            boxShadow: "3px 4px 8px rgba(0,0,0,0.15)",
            transform: "rotate(-3deg)",
          }}
        >
          {user?.imageUrl ? (
            <img 
              src={user.imageUrl} 
              alt="" 
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} 
            />
          ) : "🙂"}
        </div>

        <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, color: "#2c2c2c", margin: "0 0 4px 0" }}>
          {firstName}
        </h1>
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: "#666", margin: 0 }}>
          {userData.user.email}
        </p>

        <Doodle type="star" style={{ top: 20, right: 20 }} />
      </div>

      {/* Stats - graph paper */}
      <div
        style={{
          background: "#f8f8f8",
          backgroundImage: "linear-gradient(#d4c4b0 1px, transparent 1px), linear-gradient(90deg, #d4c4b0 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          padding: 20,
          marginBottom: 20,
          position: "relative",
          boxShadow: "2px 3px 10px rgba(0,0,0,0.12)",
          transform: "rotate(0.5deg)",
        }}
      >
        <PaperClip style={{ top: -12, right: 30 }} rotation={-10} />
        
        <div style={{ display: "flex", justifyContent: "space-around", fontFamily: "'Caveat', cursive" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: "#2d5016" }}>
              {stats?.currentStreak || 0}
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>day streak</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: "#c0392b" }}>
              {stats?.longestStreak || 0}
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>best streak</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: "#2980b9" }}>
              {stats?.totalCardsCompleted || 0}
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>explored</div>
          </div>
        </div>

        <Doodle type="circle" style={{ top: 8, left: 15 }} />
      </div>

      {/* Streak badge */}
      {stats && stats.currentStreak > 0 && (
        <div style={{ position: "absolute", right: 10, top: 180 }}>
          <StickyNote color="yellow" rotation={10}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Flame size={18} color="#ff6b6b" />
              <span style={{ fontWeight: 600 }}>{stats.currentStreak} days!</span>
            </div>
          </StickyNote>
        </div>
      )}

      {/* Menu - lined paper */}
      <div
        style={{
          background: "#fefcf6",
          backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #e8dcd0 28px)",
          backgroundSize: "100% 28px",
          padding: "20px 16px 20px 50px",
          position: "relative",
          boxShadow: "4px 5px 15px rgba(0,0,0,0.2)",
          borderLeft: "3px solid #e8b4b4",
        }}
      >
        {/* Red margin line */}
        <div style={{ position: "absolute", left: 42, top: 0, bottom: 0, width: 2, background: "#ffcccb" }} />
        
        <CoffeeStain style={{ bottom: 20, right: 10, opacity: 0.4, width: 60, height: 60 }} />

        <h2 style={{ fontFamily: "'Architects Daughter', cursive", fontSize: 18, color: "#2c2c2c", marginBottom: 16, borderBottom: "2px dashed #ccc", paddingBottom: 8 }}>
          more stuff
        </h2>

        <MenuLink href="/inbox" icon={<Inbox size={20} />} label="inbox" desc="saved media & notes" />
        <MenuLink href="/achievements" icon={<Trophy size={20} />} label="achievements" desc="your milestones" />
        <MenuLink href="/library" icon={<BookOpen size={20} />} label="library" desc="topics explored" />
        <MenuLink href="/settings" icon={<Settings size={20} />} label="settings" desc="preferences" />

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "2px dashed #ccc" }}>
          <SignOutButton>
            <button
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontFamily: "'Architects Daughter', cursive",
                fontSize: 16,
                color: "#c0392b",
              }}
            >
              <LogOut size={20} />
              sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}

function MenuLink({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  const rotation = (Math.random() - 0.5) * 1;
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 0",
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div style={{ color: "#666" }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Architects Daughter', cursive", fontSize: 16, color: "#2c2c2c", margin: 0 }}>
            {label}
          </p>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 13, color: "#888", margin: 0 }}>
            {desc}
          </p>
        </div>
        <ChevronRight size={18} style={{ color: "#ccc" }} />
      </div>
    </Link>
  );
}
