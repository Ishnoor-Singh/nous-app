"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { CreatureCharacter, CREATURES, type CreatureId, type MoodType } from "@/components/creature/CreatureCharacter";

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
  const [creatureMood, setCreatureMood] = useState<MoodType>("idle");
  const [creatureMessage, setCreatureMessage] = useState("");
  const [showCreatureMessage, setShowCreatureMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Default creature - in future, get from user preferences
  const creatureId: CreatureId = "puff";
  const creature = CREATURES[creatureId];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationData?.messages]);

  // Creature greets on mount
  useEffect(() => {
    const greetings = [
      "Hi there! 💕",
      "Ready to learn!",
      "What's up?",
      "Hiii~",
    ];
    setTimeout(() => {
      setCreatureMessage(greetings[Math.floor(Math.random() * greetings.length)]);
      setShowCreatureMessage(true);
      setCreatureMood("happy");
      setTimeout(() => {
        setShowCreatureMessage(false);
        setCreatureMood("idle");
      }, 2000);
    }, 500);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !userData?.user || isLoading) return;

    const messageText = input.trim();
    setInput("");
    setIsLoading(true);
    setCreatureMood("thinking");

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

      // Creature reacts
      setCreatureMood("talking");
      setCreatureMessage("Ooh!");
      setShowCreatureMessage(true);

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

      setTimeout(() => {
        setShowCreatureMessage(false);
        setCreatureMood("happy");
        setTimeout(() => setCreatureMood("idle"), 1500);
      }, 1000);

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
      setCreatureMood("idle");
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
    <main className="min-h-dvh flex flex-col safe-top relative">
      {/* Creature floating in corner */}
      <motion.div
        className="fixed top-20 right-4 z-20"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <CreatureCharacter
          creatureId={creatureId}
          mood={creatureMood}
          size={80}
          message={creatureMessage}
          showMessage={showCreatureMessage}
          onClick={() => {
            setCreatureMessage("Whatcha thinking?");
            setShowCreatureMessage(true);
            setCreatureMood("curious");
            setTimeout(() => {
              setShowCreatureMessage(false);
              setCreatureMood("idle");
            }, 2000);
          }}
        />
      </motion.div>

      {/* Header */}
      <header
        className="p-4 sticky top-0 z-10"
        style={{
          background: "rgba(15, 15, 26, 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: creature.bodyColor }}
          >
            <span className="text-lg">✨</span>
          </div>
          <div>
            <h1 className="font-semibold text-white text-lg">{creature.name}</h1>
            <p className="text-xs text-white/50">{creature.personality}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <CreatureCharacter creatureId={creatureId} mood="excited" size={140} />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Hey, I'm {creature.name}!
            </h2>
            <p className="text-white/50 max-w-xs mx-auto mb-4">
              {creature.personality}. Ask me anything about philosophy, history, 
              economics, art, or psychology!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["What's stoicism?", "Tell me about art", "How does money work?"].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 rounded-full text-sm text-white/70 hover:text-white transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {q}
                </button>
              ))}
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
              {message.role === "assistant" && (
                <div className="mr-2 mt-1">
                  <CreatureCharacter creatureId={creatureId} mood="happy" size={32} />
                </div>
              )}
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-accent to-purple-600 text-white rounded-br-sm"
                    : "rounded-bl-sm"
                }`}
                style={
                  message.role === "assistant"
                    ? {
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }
                    : {}
                }
              >
                <p className="whitespace-pre-wrap leading-relaxed text-white">
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="mr-2 mt-1">
              <CreatureCharacter creatureId={creatureId} mood="thinking" size={32} />
            </div>
            <div
              className="p-4 rounded-2xl rounded-bl-sm flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="w-5 h-5 text-white/50" />
              </motion.div>
              <span className="text-white/50">Thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-4"
        style={{
          background: "rgba(15, 15, 26, 0.9)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-end gap-3">
          <div
            className="flex-1 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setCreatureMood("curious")}
              onBlur={() => !isLoading && setCreatureMood("idle")}
              placeholder={`Ask ${creature.name} anything...`}
              rows={1}
              className="w-full p-4 bg-transparent resize-none focus:outline-none max-h-32 text-white placeholder:text-white/40"
              style={{ height: "auto", minHeight: "56px" }}
            />
          </div>
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-r from-accent to-purple-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </main>
  );
}
