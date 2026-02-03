"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Send, Loader2, Sparkles, 
  ChevronDown, BookOpen, Lightbulb, Brain,
  Clock, Scale, Palette, Heart
} from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";

const TOPIC_CONFIG: Record<string, { icon: any; color: string; gradient: string }> = {
  philosophy: { icon: Brain, color: "text-purple-500", gradient: "from-purple-500 to-violet-600" },
  history: { icon: Clock, color: "text-amber-500", gradient: "from-amber-500 to-orange-600" },
  economics: { icon: Scale, color: "text-emerald-500", gradient: "from-emerald-500 to-green-600" },
  art: { icon: Palette, color: "text-pink-500", gradient: "from-pink-500 to-rose-600" },
  psychology: { icon: Heart, color: "text-blue-500", gradient: "from-blue-500 to-indigo-600" },
};

// Knowledge prompts by topic
const TOPIC_STARTERS: Record<string, string[]> = {
  philosophy: [
    "What is the meaning of existence according to different philosophical traditions?",
    "How did Socrates' method of questioning change philosophy forever?",
    "What's the difference between ethics and morality?",
    "Why do philosophers argue about free will?",
  ],
  history: [
    "What patterns appear across the rise and fall of empires?",
    "How did the printing press change society more than we realize?",
    "What can we learn from civilizations that disappeared?",
    "Why do revolutions often eat their own children?",
  ],
  economics: [
    "Why do markets sometimes behave irrationally?",
    "How do incentives shape human behavior in unexpected ways?",
    "What makes some economies grow while others stagnate?",
    "Why is inflation sometimes good and sometimes devastating?",
  ],
  art: [
    "How did the Impressionists rebel against the art establishment?",
    "Why does some art sell for millions while other art is ignored?",
    "What makes something 'art' versus just a picture?",
    "How did photography change painting forever?",
  ],
  psychology: [
    "Why do we make decisions we know are bad for us?",
    "How do childhood experiences shape adult personality?",
    "What happens in the brain when we form memories?",
    "Why do humans need to belong to groups?",
  ],
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ExplorePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const cardId = params.cardId as string;

  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });
  const completeCard = useMutation(api.knowledge.completeCard);
  const logEmotion = useMutation(api.emotions.logEmotion);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState<string>("philosophy");
  const [depth, setDepth] = useState(0);
  const [showStarters, setShowStarters] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set topic from card (simplified - in real app would fetch card data)
  useEffect(() => {
    // For now, randomly select a topic if no real data
    const topics = Object.keys(TOPIC_CONFIG);
    setTopic(topics[Math.floor(Math.random() * topics.length)]);
  }, [cardId]);

  const topicConfig = TOPIC_CONFIG[topic] || TOPIC_CONFIG.philosophy;
  const TopicIcon = topicConfig.icon;
  const starters = TOPIC_STARTERS[topic] || TOPIC_STARTERS.philosophy;

  const handleStarterClick = (starter: string) => {
    setInput(starter);
    setShowStarters(false);
    handleSend(starter);
  };

  const handleSend = async (messageOverride?: string) => {
    const messageText = messageOverride || input.trim();
    if (!messageText || !userData?.user || isLoading) return;

    setInput("");
    setShowStarters(false);
    setIsLoading(true);

    // Add user message
    const newMessages: Message[] = [...messages, { role: "user", content: messageText }];
    setMessages(newMessages);

    try {
      // Get AI response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[Knowledge Exploration - ${topic.toUpperCase()}]\n\n${messageText}`,
          userId: userData.user._id,
          emotionalState: userData.emotionalState,
          messages: newMessages.slice(-8),
        }),
      });

      const data = await response.json();
      
      setMessages([...newMessages, { role: "assistant", content: data.response }]);
      setDepth(prev => Math.min(5, prev + 1));

      // Log emotional response
      if (data.emotion && userData.user) {
        await logEmotion({
          userId: userData.user._id,
          emotion: data.emotion.label,
          intensity: data.emotion.intensity,
          trigger: data.emotion.trigger,
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages([...newMessages, { 
        role: "assistant", 
        content: "I had trouble thinking about that. Let's try again?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!userData?.user) return;

    try {
      await completeCard({
        cardId: cardId as Id<"knowledgeCards">,
        depth,
        title: messages[0]?.content.slice(0, 100) || "Exploration",
        summary: messages[messages.length - 1]?.content.slice(0, 200) || "",
      });
      
      router.push("/home");
    } catch (error) {
      console.error("Failed to complete card:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="min-h-dvh flex flex-col safe-top">
      {/* Header */}
      <header className={`p-4 bg-gradient-to-r ${topicConfig.gradient} text-white`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <TopicIcon className="w-5 h-5" />
              <span className="font-semibold capitalize">{topic}</span>
            </div>
            <p className="text-sm opacity-80">Depth: {depth}/5</p>
          </div>
          {depth > 0 && (
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
            >
              Complete
            </button>
          )}
        </div>
        
        {/* Depth indicator */}
        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`flex-1 h-1 rounded-full transition-colors ${
                level <= depth ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Messages or Starters */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {showStarters && messages.length === 0 ? (
            <motion.div
              key="starters"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="text-center py-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${topicConfig.gradient} flex items-center justify-center`}>
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">What sparks your curiosity?</h2>
                <p className="text-muted-foreground">Pick a question or ask your own</p>
              </div>

              <div className="space-y-2">
                {starters.map((starter, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleStarterClick(starter)}
                    className="w-full p-4 text-left rounded-2xl bg-muted hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className={`w-5 h-5 mt-0.5 ${topicConfig.color}`} />
                      <p className="text-sm">{starter}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-4 ${
                      message.role === "user" 
                        ? `bg-gradient-to-r ${topicConfig.gradient} text-white rounded-2xl rounded-br-sm` 
                        : "message-assistant"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="message-assistant p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-muted-foreground">Exploring...</span>
                  </div>
                </motion.div>
              )}

              {/* Go Deeper prompt */}
              {messages.length > 0 && messages.length < 10 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={() => inputRef.current?.focus()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors`}
                  >
                    <ChevronDown className="w-4 h-4" />
                    <span className="text-sm">Go deeper</span>
                  </button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
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
              placeholder="Ask a follow-up question..."
              rows={1}
              className="w-full p-4 bg-transparent resize-none focus:outline-none max-h-32"
              style={{ minHeight: "56px" }}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${topicConfig.gradient} text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}
