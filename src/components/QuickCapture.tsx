"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Send, 
  Sparkles, 
  Clock, 
  Flag, 
  MapPin,
  Check,
  X,
  Loader2,
} from "lucide-react";

interface ParsedTask {
  type: string;
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: "high" | "medium" | "low" | null;
  context: string | null;
  project: string | null;
  estimatedMinutes: number | null;
  isRecurring: boolean;
  confidence: number;
}

interface QuickCaptureProps {
  onCapture: (input: string, parsed?: ParsedTask) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
}

export function QuickCapture({ 
  onCapture, 
  placeholder = "Add task... (e.g., 'Call mom tomorrow at 3pm')",
  autoFocus = false,
}: QuickCaptureProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-parse as user types (debounced)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (input.length < 3) {
      setParsed(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsParsing(true);
      try {
        const response = await fetch("/api/parse-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        });
        if (response.ok) {
          const data = await response.json();
          setParsed(data);
        }
      } catch (error) {
        console.error("Parse error:", error);
      } finally {
        setIsParsing(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCapture(input, parsed || undefined);
      setInput("");
      setParsed(null);
      setIsExpanded(false);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setIsExpanded(false);
      setInput("");
      setParsed(null);
    }
  };

  const priorityColors = {
    high: "text-red-400",
    medium: "text-yellow-400",
    low: "text-green-400",
  };

  return (
    <div className="relative">
      {/* Collapsed state - just a button */}
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => {
              setIsExpanded(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <Plus className="w-4 h-4 text-accent" />
            </div>
            <span className="text-white/50 group-hover:text-white/70 transition-colors">
              {placeholder}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-xl"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 p-4">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                {isParsing ? (
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-accent" />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-base"
              />
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setInput("");
                  setParsed(null);
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            {/* Parsed preview */}
            <AnimatePresence>
              {parsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/10 px-4 py-3 bg-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      {/* Title */}
                      <p className="text-white font-medium">{parsed.title}</p>
                      
                      {/* Metadata badges */}
                      <div className="flex flex-wrap gap-2">
                        {parsed.dueDate && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-xs text-white/70">
                            <Clock className="w-3 h-3" />
                            {parsed.dueDate}
                            {parsed.dueTime && ` at ${parsed.dueTime}`}
                          </span>
                        )}
                        {parsed.priority && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-xs ${priorityColors[parsed.priority]}`}>
                            <Flag className="w-3 h-3" />
                            {parsed.priority}
                          </span>
                        )}
                        {parsed.context && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-xs text-white/70">
                            <MapPin className="w-3 h-3" />
                            {parsed.context}
                          </span>
                        )}
                        {parsed.estimatedMinutes && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-xs text-white/70">
                            ~{parsed.estimatedMinutes}m
                          </span>
                        )}
                        {parsed.isRecurring && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-xs text-accent">
                            🔁 Recurring
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Confidence indicator */}
                    <div className="flex flex-col items-center gap-1">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: `conic-gradient(rgb(139 92 246) ${parsed.confidence * 100}%, transparent 0)`,
                        }}
                      >
                        <div className="w-6 h-6 rounded-full bg-[#0a0a0b] flex items-center justify-center">
                          <span className="text-xs text-white/70">{Math.round(parsed.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 p-3 border-t border-white/10">
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-medium text-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Add Task
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuickCapture;
