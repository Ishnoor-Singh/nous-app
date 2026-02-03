"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { TapeStrip, Doodle, PaperCard } from "@/components/paper/PaperElements";

export default function ChatPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });
  const [activeConversationId, setActiveConversationId] = useState<Id<"conversations"> | null>(null);
  const conversationData = useQuery(
    api.conversations.getWithMessages,
    activeConversationId ? { conversationId: activeConversationId } : "skip"
  );
  const createConversation = useMutation(api.conversations.create);
  const addMessage = useMutation(api.conversations.addMessage);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationData?.messages]);

  const handleSend = async () => {
    if (!input.trim() || !userData?.user || isLoading) return;

    const messageText = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      let convId = activeConversationId;
      if (!convId) {
        convId = await createConversation({ userId: userData.user._id });
        setActiveConversationId(convId);
      }

      await addMessage({
        conversationId: convId,
        role: "user",
        content: messageText,
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationId: convId,
          userId: userData.user._id,
          emotionalState: userData.emotionalState,
          messages: conversationData?.messages || [],
        }),
      });

      const data = await response.json();

      await addMessage({
        conversationId: convId,
        role: "assistant",
        content: data.response,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const messages = conversationData?.messages || [];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header 
        style={{
          padding: "16px 20px",
          background: "#f5f0e6",
          borderBottom: "3px solid #e8dcd0",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <TapeStrip style={{ position: "absolute", top: -8, right: 30 }} rotation={3} color="blue" />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div 
            style={{
              width: 44,
              height: 44,
              background: "#fff9c4",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
              transform: "rotate(-2deg)",
            }}
          >
            🧠
          </div>
          <div>
            <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: "#2c2c2c", margin: 0 }}>
              Nous
            </h1>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: "#666", margin: 0 }}>
              your thinking partner
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div 
              style={{
                width: 80,
                height: 80,
                background: "#fff9c4",
                borderRadius: 12,
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                boxShadow: "3px 4px 8px rgba(0,0,0,0.1)",
                transform: "rotate(3deg)",
              }}
            >
              ✨
            </div>
            <h2 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: "#2c2c2c", marginBottom: 8 }}>
              Let's explore together
            </h2>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: "#666", maxWidth: 280, margin: "0 auto" }}>
              Ask me about philosophy, history, economics, art, or psychology...
            </p>
            <Doodle type="arrow" style={{ position: "relative", margin: "20px auto 0", left: 0 }} />
          </div>
        )}

        {messages.map((message, index) => {
          const isUser = message.role === "user";
          const rotation = (Math.random() - 0.5) * 1;
          
          return (
            <div
              key={message._id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "12px 16px",
                  background: isUser ? "#bbdefb" : "#fefcf6",
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  boxShadow: "2px 3px 8px rgba(0,0,0,0.1)",
                  transform: `rotate(${rotation}deg)`,
                  fontFamily: "'Architects Daughter', cursive",
                  fontSize: 16,
                  color: "#2c2c2c",
                  lineHeight: 1.5,
                  border: isUser ? "none" : "2px solid #e8dcd0",
                }}
              >
                {message.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
            <div
              style={{
                padding: "12px 20px",
                background: "#fefcf6",
                borderRadius: 16,
                boxShadow: "2px 3px 8px rgba(0,0,0,0.1)",
                border: "2px solid #e8dcd0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontFamily: "'Caveat', cursive", color: "#666" }}>thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div 
        style={{
          padding: "12px 16px 24px",
          background: "#f5f0e6",
          borderTop: "3px solid #e8dcd0",
        }}
      >
        <div style={{ display: "flex", gap: 10, maxWidth: 500, margin: "0 auto" }}>
          <div 
            style={{
              flex: 1,
              background: "#fefcf6",
              borderRadius: 20,
              border: "2px solid #e8dcd0",
              boxShadow: "inset 1px 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="write something..."
              style={{
                width: "100%",
                padding: "14px 18px",
                border: "none",
                background: "transparent",
                fontFamily: "'Architects Daughter', cursive",
                fontSize: 16,
                color: "#2c2c2c",
                outline: "none",
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: input.trim() ? "#2d5016" : "#ccc",
              color: "white",
              border: "none",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "2px 3px 6px rgba(0,0,0,0.15)",
              transform: "rotate(2deg)",
              transition: "all 0.2s",
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
