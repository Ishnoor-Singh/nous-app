"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { MoodDot } from "./MoodTimeline";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  emotionalContext?: {
    valence: number;
    arousal: number;
    connection: number;
    curiosity: number;
    energy: number;
  };
  timestamp?: number;
  index?: number;
}

export function MessageBubble({ 
  role, 
  content, 
  emotionalContext, 
  timestamp,
  index = 0 
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: isUser ? 10 : -10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut"
      }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 + 0.1 }}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center"
        >
          <Brain className="w-4 h-4 text-white" />
        </motion.div>
      )}

      <div className={`max-w-[75%] ${isUser ? "order-1" : ""}`}>
        <div
          className={`p-4 ${
            isUser 
              ? "bg-accent text-accent-foreground rounded-2xl rounded-br-md" 
              : "bg-muted rounded-2xl rounded-bl-md"
          }`}
        >
          {/* Emotional indicator for AI messages */}
          {!isUser && emotionalContext && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-secondary/50">
              <MoodDot valence={emotionalContext.valence} />
              <span className="text-xs text-muted-foreground">
                {getMoodLabel(emotionalContext)}
              </span>
            </div>
          )}
          
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <p className={`text-xs text-muted-foreground mt-1 ${isUser ? "text-right" : ""}`}>
            {formatTime(timestamp)}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function getMoodLabel(state: MessageBubbleProps["emotionalContext"]): string {
  if (!state) return "";
  
  const { valence, arousal, curiosity, connection } = state;
  
  if (curiosity > 0.7) return "fascinated";
  if (connection > 0.7) return "connected";
  if (valence > 0.3 && arousal > 0.5) return "excited";
  if (valence > 0.3) return "positive";
  if (valence < -0.3) return "reflective";
  if (arousal < 0.3) return "calm";
  return "engaged";
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Thinking animation component
export function ThinkingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start gap-2"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="w-4 h-4 text-white" />
        </motion.div>
      </div>
      
      <div className="bg-muted rounded-2xl rounded-bl-md p-4">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -4, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
              className="w-2 h-2 rounded-full bg-muted-foreground"
            />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    </motion.div>
  );
}

// Welcome message component
export function WelcomeMessage({ userName }: { userName?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-lg shadow-accent/25"
      >
        <Brain className="w-8 h-8 text-white" />
      </motion.div>
      
      <h2 className="text-xl font-semibold mb-2">
        {userName ? `Hi ${userName}!` : "Hello!"}
      </h2>
      
      <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
        What would you like to explore today? Ask me anything about philosophy, history, economics, art, or psychology.
      </p>
    </motion.div>
  );
}
