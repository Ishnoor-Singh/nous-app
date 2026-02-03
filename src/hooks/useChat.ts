"use client";

import { useState, useCallback, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  emotionalContext?: {
    valence: number;
    arousal: number;
    connection: number;
    curiosity: number;
    energy: number;
  };
}

interface UseChatOptions {
  userId?: string;
  emotionalState?: any;
  onEmotionUpdate?: (emotion: any) => void;
}

export function useChat({ userId, emotionalState, onEmotionUpdate }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.trim(),
          userId,
          emotionalState,
          messages: messages.slice(-10), // Last 10 messages for context
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Create assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
        emotionalContext: emotionalState ? {
          valence: emotionalState.valence,
          arousal: emotionalState.arousal,
          connection: emotionalState.connection,
          curiosity: emotionalState.curiosity,
          energy: emotionalState.energy,
        } : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle emotion update
      if (data.emotion && onEmotionUpdate) {
        onEmotionUpdate(data.emotion);
      }

      return assistantMessage;
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // Request was cancelled, not an error
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I had trouble with that. Could you try again?",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, userId, emotionalState, onEmotionUpdate]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  // Get mood points for timeline visualization
  const moodPoints = messages
    .filter(m => m.role === "assistant" && m.emotionalContext)
    .map(m => ({
      timestamp: m.timestamp,
      valence: m.emotionalContext!.valence,
      arousal: m.emotionalContext!.arousal,
      connection: m.emotionalContext!.connection,
    }));

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    cancelRequest,
    moodPoints,
  };
}

// Simple ID generator
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
