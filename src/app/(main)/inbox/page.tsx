"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Inbox, Youtube, FileText, Podcast, Twitter,
  BookOpen, Plus, Search, Sparkles, Link as LinkIcon,
  X, ExternalLink, Play, Clock
} from "lucide-react";

// Placeholder page until Convex schema is pushed
// Run `npx convex dev` locally to enable media library

export default function InboxPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });

  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // Preview saved items
  const previewItems = [
    {
      type: "youtube",
      title: "How to Build a Second Brain",
      author: "Ali Abdaal",
      duration: "18:42",
      thumbnail: "🎬",
      status: "ready",
    },
    {
      type: "article",
      title: "The Art of Doing Nothing",
      author: "The Atlantic",
      thumbnail: "📰",
      status: "inbox",
    },
    {
      type: "podcast",
      title: "Deep Work in the Age of Distraction",
      author: "Huberman Lab",
      duration: "2:14:00",
      thumbnail: "🎙️",
      status: "ready",
    },
  ];

  const typeIcons: Record<string, React.ReactNode> = {
    youtube: <Youtube className="w-5 h-5 text-red-500" />,
    article: <FileText className="w-5 h-5 text-blue-500" />,
    podcast: <Podcast className="w-5 h-5 text-purple-500" />,
    tweet: <Twitter className="w-5 h-5 text-sky-500" />,
    book: <BookOpen className="w-5 h-5 text-amber-500" />,
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "youtube", label: "Videos" },
    { id: "article", label: "Articles" },
    { id: "podcast", label: "Podcasts" },
  ];

  return (
    <main className="min-h-dvh p-6 safe-top safe-bottom">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="w-7 h-7 text-accent" />
            Inbox
          </h1>
          <button
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <p className="text-muted-foreground mt-1">Your saved content, processed by AI</p>
      </motion.header>

      {/* Intro Banner */}
      <motion.section
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold mb-1">Share anything, Nous takes notes</h2>
            <p className="text-sm text-muted-foreground">
              Paste YouTube videos, articles, podcasts. AI extracts key points, summarizes, and makes it searchable.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Search */}
      <div className="mb-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your knowledge..."
            className="flex-1 bg-transparent focus:outline-none"
            disabled
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === f.id
                ? "bg-accent text-white"
                : "bg-muted hover:bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Preview Items */}
      <section className="mb-8">
        <div className="space-y-3">
          {previewItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-2xl bg-muted"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                  {item.thumbnail}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {typeIcons[item.type]}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === "ready" 
                        ? "bg-green-500/10 text-green-500" 
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}>
                      {item.status === "ready" ? "Processed" : "New"}
                    </span>
                  </div>
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.author}</p>
                  {item.duration && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {item.duration}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Preview only — run `npx convex dev` to enable
        </p>
      </section>

      {/* How it works */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">How it works</h2>
        <div className="space-y-4">
          <Step 
            number={1} 
            title="Share content" 
            desc="Paste a YouTube link, article URL, or any media"
          />
          <Step 
            number={2} 
            title="AI processes it" 
            desc="Nous extracts transcript, generates summary, key points"
          />
          <Step 
            number={3} 
            title="Search & reference" 
            desc="Find anything later by searching your knowledge base"
          />
        </div>
      </section>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddMediaModal onClose={() => setShowAdd(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-accent">{number}</span>
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function AddMediaModal({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState("");

  const detectType = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("twitter.com") || url.includes("x.com")) return "tweet";
    if (url.includes("spotify.com") || url.includes("podcast")) return "podcast";
    return "article";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-md bg-background rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add to Inbox</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Paste URL
            </label>
            <div className="flex items-center gap-2 p-4 bg-muted rounded-xl">
              <LinkIcon className="w-5 h-5 text-muted-foreground" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 bg-transparent focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          {url && (
            <div className="p-3 rounded-xl bg-accent/10 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm">
                Detected: <strong className="capitalize">{detectType(url)}</strong>
              </span>
            </div>
          )}

          <div className="pt-2">
            <button
              disabled
              className="w-full py-4 bg-accent text-accent-foreground rounded-xl font-semibold disabled:opacity-50"
            >
              Save & Process (Coming Soon)
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            YouTube videos, articles, podcasts, tweets — Nous handles them all
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
