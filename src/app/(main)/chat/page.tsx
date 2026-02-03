"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, Sparkles, Loader2, Video } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

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
  const logEmotion = useMutation(api.emotions.logEmotion);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      // Create conversation if needed
      let convId = activeConversationId;
      if (!convId) {
        convId = await createConversation({ userId: userData.user._id });
        setActiveConversationId(convId);
      }

      // Add user message
      await addMessage({
        conversationId: convId,
        role: "user",
        content: messageText,
      });

      // Get AI response
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

      // Add AI response
      await addMessage({
        conversationId: convId,
        role: "assistant",
        content: data.response,
        emotionalContext: userData.emotionalState ? {
          valence: userData.emotionalState.valence,
          arousal: userData.emotionalState.arousal,
          connection: userData.emotionalState.connection,
          curiosity: userData.emotionalState.curiosity,
          energy: userData.emotionalState.energy,
        } : undefined,
      });

      // Log emotional response if provided
      if (data.emotion) {
        await logEmotion({
          userId: userData.user._id,
          emotion: data.emotion.label,
          intensity: data.emotion.intensity,
          trigger: data.emotion.trigger,
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = conversationData?.messages || [];

  return (
    <main className="min-h-dvh flex flex-col safe-top">
      {/* Header */}
      <header className="p-4 glass-nav sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ 
              boxShadow: [
                "0 0 15px rgba(99, 102, 241, 0.3)",
                "0 0 25px rgba(99, 102, 241, 0.5)",
                "0 0 15px rgba(99, 102, 241, 0.3)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center"
          >
            <Brain className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="font-semibold text-white text-lg">Nous</h1>
            <p className="text-xs text-white/50">
              {userData?.emotionalState ? getMoodText(userData.emotionalState) : "Your thinking partner"}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 30px rgba(99, 102, 241, 0.2)",
                  "0 0 50px rgba(99, 102, 241, 0.4)",
                  "0 0 30px rgba(99, 102, 241, 0.2)",
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 mx-auto mb-6 rounded-full glass-accent flex items-center justify-center"
            >
              <Sparkles className="w-12 h-12 text-accent" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-3">Let's explore together</h2>
            <p className="text-white/50 max-w-xs mx-auto mb-6">
              Ask about philosophy, history, economics, art, or psychology. I'll help you understand deeply.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-white/40">
              <Video className="w-4 h-4" />
              <span>You can also share YouTube videos!</span>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.02 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 ${
                  message.role === "user" ? "message-user" : "message-assistant"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="message-assistant p-4 flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-5 h-5 text-accent" />
              </motion.div>
              <span className="text-white/50">Thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 glass-nav">
        <div className="flex items-end gap-3">
          <div className="flex-1 glass-input rounded-2xl">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something or paste a YouTube link..."
              rows={1}
              className="w-full p-4 bg-transparent resize-none focus:outline-none max-h-32 text-white placeholder:text-white/40"
              style={{ 
                height: "auto",
                minHeight: "56px",
              }}
            />
          </div>
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-r from-accent to-purple-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed glow-accent transition-all"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </main>
  );
}

function getMoodText(state: any): string {
  if (state.curiosity > 0.6) return "Curious to learn more ✨";
  if (state.connection > 0.6) return "Feeling connected 💜";
  if (state.valence > 0.3) return "In a good mood 😊";
  if (state.arousal > 0.6) return "Energized ⚡";
  return "Here for you";
}
