"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, Sparkles, Loader2 } from "lucide-react";
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
      <header className="p-4 border-b border-secondary glass sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold">Nous</h1>
            <p className="text-xs text-muted-foreground">
              {userData?.emotionalState ? getMoodText(userData.emotionalState) : "Your companion"}
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Let's explore together</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Ask me about philosophy, history, economics, art, or psychology. I'll help you understand deeply.
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 ${
                  message.role === "user" ? "message-user" : "message-assistant"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
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
            <div className="message-assistant p-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-muted-foreground">Thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-secondary glass">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-muted rounded-2xl">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
              rows={1}
              className="w-full p-4 bg-transparent resize-none focus:outline-none max-h-32"
              style={{ 
                height: "auto",
                minHeight: "56px",
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}

function getMoodText(state: any): string {
  if (state.curiosity > 0.6) return "Curious to learn more";
  if (state.connection > 0.6) return "Feeling connected";
  if (state.valence > 0.3) return "In a good mood";
  if (state.arousal > 0.6) return "Energized";
  return "Here for you";
}
