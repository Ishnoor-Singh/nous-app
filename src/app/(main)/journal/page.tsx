"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { TapeStrip, StickyNote, CoffeeStain, Doodle, PaperClip, WashiTape } from "@/components/paper/PaperElements";

export default function JournalPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });

  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [entry, setEntry] = useState("");

  if (!userData?.user) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: "#666" }}>
          Loading...
        </p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const prompts = [
    { category: "reflection", text: "What's one thing you learned about yourself today?", icon: "🪞" },
    { category: "gratitude", text: "What are three things you're grateful for right now?", icon: "🙏" },
    { category: "growth", text: "In what small way did you grow today?", icon: "🌱" },
    { category: "intention", text: "What do you want tomorrow to look like?", icon: "🎯" },
    { category: "emotion", text: "What emotion has been most present today?", icon: "💭" },
  ];

  return (
    <div style={{ padding: "20px 16px", maxWidth: 500, margin: "0 auto", position: "relative" }}>
      {/* Header */}
      <div
        style={{
          background: "#f5f0e6",
          padding: "20px 24px",
          marginBottom: 20,
          position: "relative",
          boxShadow: "3px 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <TapeStrip style={{ top: -8, left: 30 }} rotation={-2} color="peach" />
        <WashiTape pattern="dots" color="pink" style={{ top: -10, right: 40 }} rotation={3} width={50} />
        
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: "#666", margin: "0 0 4px 0" }}>
          {today}
        </p>
        <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, color: "#2c2c2c", margin: 0 }}>
          journal ✍️
        </h1>

        <Doodle type="heart" style={{ bottom: 10, right: 20 }} />
      </div>

      {/* Prompts section */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Architects Daughter', cursive", fontSize: 18, color: "#2c2c2c", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={18} color="#ffd93d" /> writing prompts
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {prompts.map((prompt, index) => {
            const rotation = (index % 2 === 0 ? 1 : -1) * (Math.random() * 2);
            return (
              <button
                key={prompt.category}
                onClick={() => {
                  setSelectedPrompt(prompt.text);
                  setEntry("");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: selectedPrompt === prompt.text ? "#fff9c4" : "#f5f0e6",
                  border: selectedPrompt === prompt.text ? "2px solid #ffd93d" : "2px solid transparent",
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  transform: `rotate(${rotation}deg)`,
                  boxShadow: "2px 2px 6px rgba(0,0,0,0.08)",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 24 }}>{prompt.icon}</span>
                <span style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: "#2c2c2c", flex: 1 }}>
                  {prompt.text}
                </span>
                <ChevronRight size={18} style={{ color: "#ccc" }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Writing area - lined paper */}
      <div
        style={{
          background: "#fefcf6",
          backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #e8dcd0 28px)",
          backgroundSize: "100% 28px",
          padding: "20px 20px 20px 56px",
          position: "relative",
          minHeight: 250,
          boxShadow: "4px 5px 15px rgba(0,0,0,0.2)",
          borderLeft: "3px solid #e8b4b4",
        }}
      >
        {/* Red margin line */}
        <div style={{ position: "absolute", left: 46, top: 0, bottom: 0, width: 2, background: "#ffcccb" }} />
        
        <CoffeeStain style={{ bottom: 30, right: 15, opacity: 0.4 }} />
        <PaperClip style={{ top: -12, right: 25 }} />

        {selectedPrompt ? (
          <>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: "#888", marginBottom: 12, fontStyle: "italic" }}>
              {selectedPrompt}
            </p>
            <textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="start writing..."
              autoFocus
              style={{
                width: "100%",
                minHeight: 180,
                border: "none",
                background: "transparent",
                fontFamily: "'Architects Daughter', cursive",
                fontSize: 18,
                color: "#2c2c2c",
                lineHeight: "28px",
                resize: "none",
                outline: "none",
              }}
            />
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 12, color: "#aaa", marginTop: 8 }}>
              {entry.split(/\s+/).filter(Boolean).length} words
            </p>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: "#666" }}>
              pick a prompt above to start writing...
            </p>
          </div>
        )}

        <Doodle type="underline" style={{ bottom: 20, left: 10 }} />
      </div>

      {/* Coming soon note */}
      <div style={{ position: "absolute", right: -10, top: 120 }}>
        <StickyNote color="green" rotation={-6}>
          <div style={{ fontSize: 13 }}>
            AI reflections<br/>coming soon! 🧠
          </div>
        </StickyNote>
      </div>

      {/* Chat alternative */}
      <Link href="/chat" style={{ textDecoration: "none" }}>
        <div
          style={{
            marginTop: 20,
            padding: "16px 20px",
            background: "#f5f0e6",
            borderRadius: 12,
            boxShadow: "2px 3px 8px rgba(0,0,0,0.1)",
            transform: "rotate(-0.5deg)",
          }}
        >
          <WashiTape pattern="stripes" color="mint" style={{ top: -10, left: 20 }} rotation={-3} width={50} />
          <p style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 14, color: "#2c2c2c", margin: 0 }}>
            💬 prefer to talk?
          </p>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: "#666", margin: "4px 0 0 0" }}>
            chat with nous instead →
          </p>
        </div>
      </Link>
    </div>
  );
}
