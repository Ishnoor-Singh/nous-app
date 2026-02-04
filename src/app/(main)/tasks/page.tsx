"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Circle,
  ChevronRight,
  Flag,
  Clock,
  MapPin,
  FolderKanban,
  Plus,
  Filter,
  Sparkles,
  Inbox,
  AlertCircle,
  Zap,
  Calendar,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import QuickCapture from "@/components/QuickCapture";

type FilterType = "all" | "today" | "overdue" | "high" | "context";
type ContextFilter = "all" | "home" | "work" | "errands" | "phone" | "computer" | "anywhere";

const CONTEXT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  home: { icon: "🏠", label: "Home", color: "bg-blue-500/20 text-blue-400" },
  work: { icon: "💼", label: "Work", color: "bg-purple-500/20 text-purple-400" },
  errands: { icon: "🏃", label: "Errands", color: "bg-orange-500/20 text-orange-400" },
  phone: { icon: "📱", label: "Phone", color: "bg-green-500/20 text-green-400" },
  computer: { icon: "💻", label: "Computer", color: "bg-cyan-500/20 text-cyan-400" },
  anywhere: { icon: "🌍", label: "Anywhere", color: "bg-gray-500/20 text-gray-400" },
};

const PRIORITY_CONFIG = {
  high: { icon: "🔴", label: "High", color: "text-red-400" },
  medium: { icon: "🟡", label: "Medium", color: "text-yellow-400" },
  low: { icon: "🟢", label: "Low", color: "text-green-400" },
};

export default function TasksPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });
  
  const todos = useQuery(api.todos.getTodos, {
    userId: userData?.user?._id || ("" as any),
  });
  
  const createTodo = useMutation(api.todos.createTodo);
  const completeTodo = useMutation(api.todos.completeTodo);
  const uncompleteTodo = useMutation(api.todos.uncompleteTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);

  const [filter, setFilter] = useState<FilterType>("all");
  const [contextFilter, setContextFilter] = useState<ContextFilter>("all");
  const [showCompleted, setShowCompleted] = useState(false);

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  
  // Filter and sort tasks
  const filteredTodos = (todos || []).filter((todo) => {
    // Filter by completion
    if (!showCompleted && todo.completed) return false;
    if (showCompleted && !todo.completed) return false;

    // Filter by type
    switch (filter) {
      case "today":
        return todo.dueDate === today;
      case "overdue":
        return todo.dueDate && todo.dueDate < today && !todo.completed;
      case "high":
        return todo.priority === "high";
      case "context":
        return contextFilter === "all" || todo.context === contextFilter || (!todo.context && contextFilter === "anywhere");
      default:
        return true;
    }
  });

  // Sort: overdue first, then by priority, then by due date
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // Overdue items first
    const aOverdue = a.dueDate && a.dueDate < today && !a.completed;
    const bOverdue = b.dueDate && b.dueDate < today && !b.completed;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
    if (aPriority !== bPriority) return aPriority - bPriority;

    // Then by due date
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    return 0;
  });

  // Stats
  const stats = {
    total: todos?.filter((t) => !t.completed).length || 0,
    overdue: todos?.filter((t) => t.dueDate && t.dueDate < today && !t.completed).length || 0,
    dueToday: todos?.filter((t) => t.dueDate === today && !t.completed).length || 0,
    highPriority: todos?.filter((t) => t.priority === "high" && !t.completed).length || 0,
  };

  const handleCapture = async (input: string, parsed?: any) => {
    await createTodo({
      userId: userData.user._id,
      title: parsed?.title || input,
      priority: parsed?.priority || "medium",
      dueDate: parsed?.dueDate || undefined,
      dueTime: parsed?.dueTime || undefined,
    });
  };

  const handleToggle = async (todoId: any, completed: boolean) => {
    if (completed) {
      await uncompleteTodo({ todoId });
    } else {
      await completeTodo({ todoId });
    }
  };

  const handleDelete = async (todoId: any) => {
    await deleteTodo({ todoId });
  };

  return (
    <main className="min-h-dvh p-6 safe-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-white text-glow">Tasks</h1>
        <p className="text-white/50 mt-1">Stay on top of everything</p>
      </motion.header>

      {/* Quick Stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-3 mb-6"
      >
        <button
          onClick={() => setFilter("all")}
          className={`p-3 rounded-xl text-center transition-all ${
            filter === "all" ? "glass-accent glow-accent" : "glass-card"
          }`}
        >
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-white/50">Total</p>
        </button>
        <button
          onClick={() => setFilter("overdue")}
          className={`p-3 rounded-xl text-center transition-all ${
            filter === "overdue" ? "glass-danger" : "glass-card"
          } ${stats.overdue > 0 ? "animate-pulse" : ""}`}
        >
          <p className={`text-2xl font-bold ${stats.overdue > 0 ? "text-red-400" : "text-white"}`}>
            {stats.overdue}
          </p>
          <p className="text-xs text-white/50">Overdue</p>
        </button>
        <button
          onClick={() => setFilter("today")}
          className={`p-3 rounded-xl text-center transition-all ${
            filter === "today" ? "glass-accent glow-accent" : "glass-card"
          }`}
        >
          <p className="text-2xl font-bold text-white">{stats.dueToday}</p>
          <p className="text-xs text-white/50">Today</p>
        </button>
        <button
          onClick={() => setFilter("high")}
          className={`p-3 rounded-xl text-center transition-all ${
            filter === "high" ? "glass-accent glow-accent" : "glass-card"
          }`}
        >
          <p className="text-2xl font-bold text-white">{stats.highPriority}</p>
          <p className="text-xs text-white/50">High</p>
        </button>
      </motion.div>

      {/* Quick Capture */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <QuickCapture
          onCapture={handleCapture}
          placeholder="Add task... 'Call mom tomorrow at 3pm'"
        />
      </motion.div>

      {/* Context Filters */}
      {filter === "context" && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mb-4 flex flex-wrap gap-2"
        >
          {Object.entries(CONTEXT_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setContextFilter(key as ContextFilter)}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-all ${
                contextFilter === key
                  ? config.color
                  : "glass-button hover:bg-white/10"
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setFilter("context")}
          className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 transition-all ${
            filter === "context" ? "glass-accent" : "glass-button"
          }`}
        >
          <MapPin className="w-4 h-4" />
          By Context
        </button>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          {showCompleted ? "Show Active" : "Show Completed"}
        </button>
      </div>

      {/* Task List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {sortedTodos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-card flex items-center justify-center">
                <Inbox className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50">
                {showCompleted ? "No completed tasks" : "No tasks here!"}
              </p>
              <p className="text-white/30 text-sm mt-1">
                {showCompleted ? "Complete some tasks first" : "Add one above to get started"}
              </p>
            </motion.div>
          ) : (
            sortedTodos.map((todo, index) => {
              const isOverdue = todo.dueDate && todo.dueDate < today && !todo.completed;
              const isDueToday = todo.dueDate === today;

              return (
                <motion.div
                  key={todo._id}
                  layout
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card p-4 ${
                    isOverdue ? "border-red-500/30" : ""
                  } ${todo.completed ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(todo._id, todo.completed)}
                      className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                        todo.completed
                          ? "bg-accent text-white"
                          : "border-2 border-white/30 hover:border-accent"
                      }`}
                    >
                      {todo.completed && <Check className="w-4 h-4" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${
                          todo.completed
                            ? "line-through text-white/50"
                            : "text-white"
                        }`}
                      >
                        {todo.title}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {todo.priority && (
                          <span
                            className={`text-xs ${
                              PRIORITY_CONFIG[todo.priority as keyof typeof PRIORITY_CONFIG]?.color
                            }`}
                          >
                            {PRIORITY_CONFIG[todo.priority as keyof typeof PRIORITY_CONFIG]?.icon}
                          </span>
                        )}
                        {todo.dueDate && (
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              isOverdue
                                ? "text-red-400"
                                : isDueToday
                                ? "text-accent"
                                : "text-white/50"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {isOverdue
                              ? "Overdue"
                              : isDueToday
                              ? "Today"
                              : todo.dueDate}
                            {todo.dueTime && ` ${todo.dueTime}`}
                          </span>
                        )}
                        {todo.context && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              CONTEXT_CONFIG[todo.context]?.color || "bg-white/10"
                            }`}
                          >
                            {CONTEXT_CONFIG[todo.context]?.icon}{" "}
                            {CONTEXT_CONFIG[todo.context]?.label}
                          </span>
                        )}
                        {todo.estimatedMinutes && (
                          <span className="text-xs text-white/40">
                            ~{todo.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(todo._id)}
                      className="p-2 rounded-full hover:bg-white/10 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* AI Suggestion (placeholder for smart suggestions) */}
      {!showCompleted && stats.total > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass-card glass-accent p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Nous suggests</p>
              <p className="text-xs text-white/60">
                {stats.overdue > 0
                  ? `You have ${stats.overdue} overdue task${stats.overdue > 1 ? "s" : ""}. Let's tackle them first!`
                  : stats.dueToday > 0
                  ? `${stats.dueToday} task${stats.dueToday > 1 ? "s" : ""} due today. You've got this!`
                  : "Looking good! Stay on top of your priorities."}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
