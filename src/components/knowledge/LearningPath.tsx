"use client";

import { motion } from "framer-motion";
import { 
  Check, Lock, Play, Star, 
  Brain, Clock, Scale, Palette, Heart
} from "lucide-react";

export interface PathNode {
  id: string;
  title: string;
  description: string;
  status: "locked" | "available" | "in-progress" | "completed";
  type: "lesson" | "challenge" | "project";
  estimatedMinutes: number;
}

export interface LearningPath {
  id: string;
  topic: string;
  title: string;
  description: string;
  nodes: PathNode[];
  progress: number;
}

const TOPIC_ICONS: Record<string, any> = {
  philosophy: Brain,
  history: Clock,
  economics: Scale,
  art: Palette,
  psychology: Heart,
};

const TOPIC_COLORS: Record<string, string> = {
  philosophy: "from-purple-500 to-violet-600",
  history: "from-amber-500 to-orange-600",
  economics: "from-emerald-500 to-green-600",
  art: "from-pink-500 to-rose-600",
  psychology: "from-blue-500 to-indigo-600",
};

interface LearningPathProps {
  path: LearningPath;
  onNodeClick?: (node: PathNode) => void;
}

export function LearningPathView({ path, onNodeClick }: LearningPathProps) {
  const TopicIcon = TOPIC_ICONS[path.topic] || Brain;
  const gradient = TOPIC_COLORS[path.topic] || "from-accent to-purple-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-5 rounded-2xl bg-gradient-to-r ${gradient} text-white`}>
        <div className="flex items-center gap-3 mb-3">
          <TopicIcon className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">{path.title}</h2>
            <p className="text-sm opacity-80">{path.description}</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>{Math.round(path.progress)}% complete</span>
            <span>{path.nodes.filter(n => n.status === "completed").length}/{path.nodes.length} lessons</span>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${path.progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-white"
            />
          </div>
        </div>
      </div>

      {/* Path visualization */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-secondary" />

        {/* Nodes */}
        <div className="space-y-4">
          {path.nodes.map((node, index) => (
            <PathNodeCard
              key={node.id}
              node={node}
              index={index}
              topicGradient={gradient}
              onClick={() => onNodeClick?.(node)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PathNodeCard({ 
  node, 
  index, 
  topicGradient, 
  onClick 
}: { 
  node: PathNode; 
  index: number; 
  topicGradient: string;
  onClick?: () => void;
}) {
  const statusConfig = {
    locked: {
      icon: Lock,
      bg: "bg-muted",
      text: "text-muted-foreground",
      ring: "ring-muted",
    },
    available: {
      icon: Play,
      bg: `bg-gradient-to-r ${topicGradient}`,
      text: "text-white",
      ring: "ring-accent",
    },
    "in-progress": {
      icon: Play,
      bg: `bg-gradient-to-r ${topicGradient}`,
      text: "text-white",
      ring: "ring-amber-500 ring-2",
    },
    completed: {
      icon: Check,
      bg: "bg-emerald-500",
      text: "text-white",
      ring: "ring-emerald-500",
    },
  };

  const config = statusConfig[node.status];
  const Icon = config.icon;
  const isClickable = node.status !== "locked";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative flex items-start gap-4"
    >
      {/* Node circle */}
      <div className={`relative z-10 w-12 h-12 rounded-full ${config.bg} ${config.text} flex items-center justify-center flex-shrink-0 ${config.ring}`}>
        <Icon className="w-5 h-5" />
        
        {/* Star badge for completed */}
        {node.status === "completed" && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
            <Star className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <button
        onClick={onClick}
        disabled={!isClickable}
        className={`flex-1 p-4 rounded-2xl text-left transition-all ${
          isClickable 
            ? "bg-muted hover:bg-secondary cursor-pointer" 
            : "bg-muted/50 opacity-60 cursor-not-allowed"
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                node.type === "challenge" 
                  ? "bg-amber-500/20 text-amber-600" 
                  : node.type === "project"
                    ? "bg-purple-500/20 text-purple-600"
                    : "bg-accent/20 text-accent"
              }`}>
                {node.type}
              </span>
              <span className="text-xs text-muted-foreground">
                ~{node.estimatedMinutes} min
              </span>
            </div>
            <h3 className="font-semibold">{node.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {node.description}
            </p>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// Sample learning path
export const SAMPLE_PATH: LearningPath = {
  id: "philosophy-101",
  topic: "philosophy",
  title: "Introduction to Philosophy",
  description: "Start your journey into the big questions of existence",
  progress: 40,
  nodes: [
    {
      id: "1",
      title: "What is Philosophy?",
      description: "Explore the origins and purpose of philosophical inquiry",
      status: "completed",
      type: "lesson",
      estimatedMinutes: 5,
    },
    {
      id: "2",
      title: "The Socratic Method",
      description: "Learn the art of asking questions that lead to insight",
      status: "completed",
      type: "lesson",
      estimatedMinutes: 8,
    },
    {
      id: "3",
      title: "Challenge: Question Everything",
      description: "Apply the Socratic method to a modern problem",
      status: "in-progress",
      type: "challenge",
      estimatedMinutes: 10,
    },
    {
      id: "4",
      title: "Introduction to Ethics",
      description: "What makes actions right or wrong?",
      status: "available",
      type: "lesson",
      estimatedMinutes: 7,
    },
    {
      id: "5",
      title: "The Trolley Problem",
      description: "Explore this famous ethical dilemma",
      status: "locked",
      type: "challenge",
      estimatedMinutes: 12,
    },
    {
      id: "6",
      title: "Build Your Philosophy",
      description: "Create your own personal philosophy statement",
      status: "locked",
      type: "project",
      estimatedMinutes: 15,
    },
  ],
};
