"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { TactileCard, TactileButton } from "@/components/tactile/TactileElements";

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
          background: "linear-gradient(180deg, #f7f0e6 0%, #f0e6d8 100%)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
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
              boxShadow: "4px 4px 12px rgba(196, 149, 106, 0.3), -2px -2px 8px rgba(255, 255, 255, 0.5)",
            }}
          >
            <span style={{ fontSize: 24 }}>🧠</span>
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#4a4035", margin: 0 }}>
              Nous
            </h1>
            <p style={{ fontSize: 13, color: "#8a7b6d", margin: 0 }}>
              Your thinking partner
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "60px 20px" }}
          >
            <div 
              style={{
                width: 80,
                height: 80,
                background: "linear-gradient(145deg, #c4956a, #b38656)",
                borderRadius: 24,
                margin: "0 auto 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "8px 8px 24px rgba(196, 149, 106, 0.25), -4px -4px 16px rgba(255, 255, 255, 0.6)",
              }}
            >
              <Sparkles size={36} color="white" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#4a4035", marginBottom: 8 }}>
              Let's explore together
            </h2>
            <p style={{ fontSize: 16, color: "#8a7b6d", maxWidth: 280, margin: "0 auto" }}>
              Ask me about philosophy, history, economics, art, or psychology...
            </p>
          </motion.div>
        )}

        {messages.map((message, index) => {
          const isUser = message.role === "user";
          
          return (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "14px 18px",
                  background: isUser 
                    ? "linear-gradient(145deg, #7a99b5, #6b8aa6)"
                    : "linear-gradient(145deg, #fdf8f2, #f7f0e6)",
                  borderRadius: isUser ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                  boxShadow: isUser
                    ? "4px 4px 12px rgba(122, 153, 181, 0.3), -2px -2px 8px rgba(255, 255, 255, 0.3)"
                    : "4px 4px 12px rgba(0, 0, 0, 0.08), -2px -2px 8px rgba(255, 255, 255, 0.6)",
                  color: isUser ? "white" : "#4a4035",
                  fontSize: 15,
                  lineHeight: 1.5,
                }}
              >
                {message.content}
              </div>
            </motion.div>
          );
        })}

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}
          >
            <div
              style={{
                padding: "14px 20px",
                background: "linear-gradient(145deg, #fdf8f2, #f7f0e6)",
                borderRadius: 20,
                boxShadow: "4px 4px 12px rgba(0, 0, 0, 0.08), -2px -2px 8px rgba(255, 255, 255, 0.6)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#c4956a" }} />
              <span style={{ color: "#8a7b6d" }}>Thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div 
        style={{
          padding: "12px 16px 24px",
          background: "linear-gradient(180deg, #f0e6d8 0%, #f7f0e6 100%)",
        }}
      >
        <div style={{ display: "flex", gap: 12, maxWidth: 500, margin: "0 auto" }}>
          <div 
            style={{
              flex: 1,
              background: "#e8ddd0",
              borderRadius: 24,
              boxShadow: "inset 2px 2px 6px rgba(0, 0, 0, 0.08), inset -1px -1px 4px rgba(255, 255, 255, 0.3)",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask something..."
              style={{
                width: "100%",
                padding: "16px 20px",
                border: "none",
                background: "transparent",
                fontSize: 16,
                color: "#4a4035",
                outline: "none",
              }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              background: input.trim() 
                ? "linear-gradient(145deg, #c4956a, #b38656)"
                : "#e8ddd0",
              color: input.trim() ? "white" : "#b5a596",
              border: "none",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: input.trim()
                ? "4px 4px 12px rgba(196, 149, 106, 0.3), -2px -2px 8px rgba(255, 255, 255, 0.5)"
                : "inset 2px 2px 6px rgba(0, 0, 0, 0.08)",
            }}
          >
            <Send size={22} />
          </motion.button>
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
