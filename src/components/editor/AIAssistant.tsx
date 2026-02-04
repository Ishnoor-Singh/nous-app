"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Lightbulb,
  Wand2,
  MessageSquare,
  Brain,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantProps {
  noteTitle: string;
  noteContent: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onInsertText?: (text: string) => void;
}

const quickActions = [
  { id: "continue", label: "Continue writing", icon: Wand2 },
  { id: "summarize", label: "Summarize", icon: Brain },
  { id: "ideas", label: "Brainstorm ideas", icon: Lightbulb },
  { id: "improve", label: "Improve writing", icon: Sparkles },
];

export default function AIAssistant({
  noteTitle,
  noteContent,
  isCollapsed,
  onToggle,
  onInsertText,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const prompt = customPrompt || input;
    if (!prompt.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a helpful writing assistant. The user is working on a note titled "${noteTitle}". 
              
Current content of the note:
---
${noteContent || "(empty)"}
---

Help them with their writing. Be concise and practical. If they ask you to write something, provide the text directly without unnecessary explanation.`,
            },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || data.content || "Sorry, I couldn't generate a response.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionId: string) => {
    const prompts: Record<string, string> = {
      continue: "Continue writing from where I left off. Match my style and tone.",
      summarize: "Summarize the main points of my note in a few bullet points.",
      ideas: "Suggest 3-5 ideas to expand on or directions I could take this note.",
      improve: "Suggest improvements to make my writing clearer and more engaging.",
    };
    handleSend(prompts[actionId]);
  };

  const handleInsert = (content: string) => {
    onInsertText?.(content);
  };

  if (isCollapsed) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 p-3 glass-card border-l border-y border-white/10 rounded-l-xl hover:bg-white/5 transition-all z-40"
        title="Open AI Assistant"
      >
        <ChevronLeft className="w-5 h-5 text-white/70" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      className="h-full flex flex-col glass-nav border-l border-white/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AI Assistant</h3>
            <p className="text-xs text-white/40">Ask anything about your note</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-white/10 transition-all"
        >
          <ChevronRight className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="p-4 border-b border-white/10">
          <p className="text-xs text-white/40 mb-3">Quick actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                disabled={isLoading}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs transition-all disabled:opacity-50"
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-accent" />
            </div>
            <p className="text-white/50 text-sm">
              Ask me to help with your writing
            </p>
            <p className="text-white/30 text-xs mt-1">
              I can see your current note content
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] p-3 rounded-xl text-sm ${
                  message.role === "user"
                    ? "bg-accent/30 text-white"
                    : "bg-white/10 text-white/90"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {/* Insert button for assistant messages */}
                {message.role === "assistant" && onInsertText && (
                  <button
                    onClick={() => handleInsert(message.content)}
                    className="mt-2 text-xs text-accent hover:text-accent/80 flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    Insert into note
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 p-3 rounded-xl flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
              <span className="text-sm text-white/60">Thinking...</span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your note..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-accent/30 hover:bg-accent/50 disabled:opacity-50 disabled:hover:bg-accent/30 transition-all"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
