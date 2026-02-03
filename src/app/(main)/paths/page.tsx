"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { 
  Brain, Clock, Scale, Palette, Heart,
  ChevronRight, Star, Lock
} from "lucide-react";
import Link from "next/link";

const LEARNING_PATHS = [
  {
    id: "philosophy-101",
    topic: "philosophy",
    title: "Introduction to Philosophy",
    description: "Explore the big questions of existence",
    lessons: 6,
    completedLessons: 2,
    estimatedHours: 2,
    status: "in-progress" as const,
  },
  {
    id: "history-patterns",
    topic: "history",
    title: "Patterns of History",
    description: "Learn from civilizations past",
    lessons: 8,
    completedLessons: 0,
    estimatedHours: 3,
    status: "available" as const,
  },
  {
    id: "economics-101",
    topic: "economics",
    title: "Economic Thinking",
    description: "Understand incentives and systems",
    lessons: 7,
    completedLessons: 0,
    estimatedHours: 2.5,
    status: "available" as const,
  },
  {
    id: "art-movements",
    topic: "art",
    title: "Art Through the Ages",
    description: "From cave paintings to digital art",
    lessons: 10,
    completedLessons: 0,
    estimatedHours: 4,
    status: "locked" as const,
  },
  {
    id: "psychology-mind",
    topic: "psychology",
    title: "Understanding the Mind",
    description: "Why we think and behave as we do",
    lessons: 9,
    completedLessons: 0,
    estimatedHours: 3.5,
    status: "locked" as const,
  },
];

const TOPIC_CONFIG: Record<string, { icon: any; gradient: string }> = {
  philosophy: { icon: Brain, gradient: "from-purple-500 to-violet-600" },
  history: { icon: Clock, gradient: "from-amber-500 to-orange-600" },
  economics: { icon: Scale, gradient: "from-emerald-500 to-green-600" },
  art: { icon: Palette, gradient: "from-pink-500 to-rose-600" },
  psychology: { icon: Heart, gradient: "from-blue-500 to-indigo-600" },
};

export default function PathsPage() {
  const { user } = useUser();

  const inProgress = LEARNING_PATHS.filter(p => p.status === "in-progress");
  const available = LEARNING_PATHS.filter(p => p.status === "available");
  const locked = LEARNING_PATHS.filter(p => p.status === "locked");

  return (
    <main className="min-h-dvh p-6 safe-top">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold">Learning Paths</h1>
        <p className="text-muted-foreground">
          Structured journeys through knowledge
        </p>
      </motion.div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <Section title="Continue Learning" delay={0.1}>
          {inProgress.map((path, index) => (
            <PathCard key={path.id} path={path} index={index} />
          ))}
        </Section>
      )}

      {/* Available */}
      <Section title="Available Paths" delay={0.2}>
        {available.map((path, index) => (
          <PathCard key={path.id} path={path} index={index} />
        ))}
      </Section>

      {/* Locked */}
      <Section title="Coming Soon" delay={0.3}>
        {locked.map((path, index) => (
          <PathCard key={path.id} path={path} index={index} locked />
        ))}
      </Section>
    </main>
  );
}

function Section({ title, children, delay }: { title: string; children: React.ReactNode; delay: number }) {
  return (
    <motion.section
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="mb-8"
    >
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </motion.section>
  );
}

function PathCard({ path, index, locked = false }: { 
  path: typeof LEARNING_PATHS[0]; 
  index: number;
  locked?: boolean;
}) {
  const config = TOPIC_CONFIG[path.topic];
  const Icon = config?.icon || Brain;
  const progress = path.lessons > 0 ? (path.completedLessons / path.lessons) * 100 : 0;

  const content = (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 rounded-2xl ${locked ? "bg-muted/50 opacity-60" : "bg-muted"} relative overflow-hidden`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          locked 
            ? "bg-secondary text-muted-foreground" 
            : `bg-gradient-to-br ${config?.gradient || "from-accent to-purple-600"} text-white`
        }`}>
          {locked ? <Lock className="w-5 h-5" /> : <Icon className="w-6 h-6" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{path.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {path.description}
              </p>
            </div>
            {!locked && (
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>{path.lessons} lessons</span>
            <span>~{path.estimatedHours}h</span>
            {path.status === "in-progress" && (
              <span className="text-accent font-medium">
                {Math.round(progress)}% complete
              </span>
            )}
          </div>

          {/* Progress bar (if in progress) */}
          {path.status === "in-progress" && (
            <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className={`h-full bg-gradient-to-r ${config?.gradient || "from-accent to-purple-600"}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* In Progress badge */}
      {path.status === "in-progress" && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full font-medium">
            In Progress
          </span>
        </div>
      )}
    </motion.div>
  );

  if (locked) {
    return content;
  }

  return (
    <Link href={`/path/${path.id}`}>
      {content}
    </Link>
  );
}
