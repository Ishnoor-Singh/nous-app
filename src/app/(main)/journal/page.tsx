"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, PenTool, MessageCircle } from "lucide-react";
import Link from "next/link";
import { TactileCard, TactileButton, TactileBadge } from "@/components/tactile/TactileElements";

export default function JournalPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });

  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [entry, setEntry] = useState("");

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

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const prompts = [
    { category: "reflection", text: "What's one thing you learned about yourself today?", icon: "🪞", color: "#9b87b2" },
    { category: "gratitude", text: "What are three things you're grateful for right now?", icon: "🙏", color: "#7d9b76" },
    { category: "growth", text: "In what small way did you grow today?", icon: "🌱", color: "#7a99b5" },
    { category: "intention", text: "What do you want tomorrow to look like?", icon: "🎯", color: "#d4a574" },
    { category: "emotion", text: "What emotion has been most present today?", icon: "💭", color: "#c4956a" },
  ];

  return (
    <div style={{ padding: "20px 16px", maxWidth: 500, margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ marginBottom: 24 }}
      >
        <p style={{ fontSize: 14, color: "#8a7b6d", margin: "0 0 4px 0" }}>
          {today}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#4a4035", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <PenTool size={26} color="#9b87b2" />
          Journal
        </h1>
      </motion.div>

      {/* Prompts */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#4a4035", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={18} color="#d4a574" /> Writing Prompts
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {prompts.map((prompt, index) => (
            <motion.div
              key={prompt.category}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <TactileCard
                onClick={() => {
                  setSelectedPrompt(prompt.text);
                  setEntry("");
                }}
                variant={selectedPrompt === prompt.text ? "pressed" : "raised"}
                style={{ padding: 14 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      background: `linear-gradient(145deg, ${prompt.color}, ${prompt.color}dd)`,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      boxShadow: `2px 2px 8px ${prompt.color}40`,
                    }}
                  >
                    {prompt.icon}
                  </div>
                  <span style={{ 
                    flex: 1, 
                    fontSize: 15, 
                    color: selectedPrompt === prompt.text ? "#8a7b6d" : "#4a4035",
                    fontWeight: 500,
                  }}>
                    {prompt.text}
                  </span>
                  <ChevronRight size={18} style={{ color: "#c9bfb0" }} />
                </div>
              </TactileCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Writing Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <TactileCard variant="floating" style={{ padding: 0, overflow: "hidden" }}>
          {selectedPrompt ? (
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <TactileBadge color="primary">
                  Active prompt
                </TactileBadge>
              </div>
              <p style={{ fontSize: 14, color: "#8a7b6d", marginBottom: 16, fontStyle: "italic" }}>
                {selectedPrompt}
              </p>
              <textarea
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="Start writing..."
                autoFocus
                style={{
                  width: "100%",
                  minHeight: 200,
                  border: "none",
                  background: "#e8ddd0",
                  borderRadius: 16,
                  padding: 16,
                  fontSize: 16,
                  color: "#4a4035",
                  lineHeight: 1.6,
                  resize: "none",
                  outline: "none",
                  boxShadow: "inset 2px 2px 6px rgba(0, 0, 0, 0.06), inset -1px -1px 4px rgba(255, 255, 255, 0.3)",
                }}
              />
              <p style={{ fontSize: 13, color: "#8a7b6d", marginTop: 12, textAlign: "right" }}>
                {entry.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  background: "linear-gradient(145deg, #9b87b2, #8a77a1)",
                  borderRadius: 20,
                  margin: "0 auto 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "4px 4px 12px rgba(155, 135, 178, 0.25)",
                }}
              >
                <PenTool size={36} color="white" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#4a4035", marginBottom: 8 }}>
                Pick a prompt to start
              </h3>
              <p style={{ color: "#8a7b6d" }}>
                Select one of the prompts above to begin journaling
              </p>
            </div>
          )}
        </TactileCard>
      </motion.div>

      {/* AI Coming Soon Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ marginTop: 20 }}
      >
        <TactileCard style={{ background: "linear-gradient(145deg, #7a99b520, #7a99b510)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "linear-gradient(145deg, #7a99b5, #6b8aa6)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "3px 3px 10px rgba(122, 153, 181, 0.25)",
              }}
            >
              <span style={{ fontSize: 24 }}>🧠</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: "#4a4035", margin: "0 0 2px 0" }}>
                AI Reflections
              </p>
              <p style={{ fontSize: 13, color: "#8a7b6d", margin: 0 }}>
                Coming soon - personalized insights
              </p>
            </div>
          </div>
        </TactileCard>
      </motion.div>

      {/* Chat Alternative */}
      <Link href="/chat" style={{ textDecoration: "none" }}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: 16 }}
        >
          <TactileCard>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "linear-gradient(145deg, #c4956a, #b38656)",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "3px 3px 10px rgba(196, 149, 106, 0.25)",
                }}
              >
                <MessageCircle size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: "#4a4035", margin: "0 0 2px 0" }}>
                  Prefer to talk?
                </p>
                <p style={{ fontSize: 13, color: "#8a7b6d", margin: 0 }}>
                  Chat with Nous instead →
                </p>
              </div>
              <ChevronRight size={20} style={{ color: "#c9bfb0" }} />
            </div>
          </TactileCard>
        </motion.div>
      </Link>
    </div>
  );
}
