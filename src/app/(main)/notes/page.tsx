"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Pin,
  Archive,
  Tag,
  Clock,
  MessageSquare,
  FileText,
  Video,
  BookOpen,
  Sparkles,
  MoreHorizontal,
  Trash2,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

// Source icons and colors
const SOURCE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  chat: { icon: MessageSquare, label: "Chat", color: "bg-purple-500/20 text-purple-400" },
  manual: { icon: FileText, label: "Manual", color: "bg-blue-500/20 text-blue-400" },
  video: { icon: Video, label: "Video", color: "bg-red-500/20 text-red-400" },
  article: { icon: BookOpen, label: "Article", color: "bg-green-500/20 text-green-400" },
  highlight: { icon: Sparkles, label: "Highlight", color: "bg-yellow-500/20 text-yellow-400" },
  journal: { icon: BookOpen, label: "Journal", color: "bg-pink-500/20 text-pink-400" },
  capture: { icon: Sparkles, label: "Capture", color: "bg-cyan-500/20 text-cyan-400" },
  import: { icon: FileText, label: "Import", color: "bg-gray-500/20 text-gray-400" },
};

type ViewMode = "all" | "pinned" | "archived";

export default function NotesPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });

  const notes = useQuery(api.notes.getNotes, {
    userId: userData?.user?._id || ("" as any),
    includeArchived: false,
  });

  const pinnedNotes = useQuery(api.notes.getPinnedNotes, {
    userId: userData?.user?._id || ("" as any),
  });

  const tags = useQuery(api.notes.getTags, {
    userId: userData?.user?._id || ("" as any),
  });

  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const togglePin = useMutation(api.notes.togglePinNote);
  const archiveNote = useMutation(api.notes.archiveNote);
  const deleteNote = useMutation(api.notes.deleteNote);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  // Search notes
  const searchResults = useQuery(
    api.notes.searchNotes,
    searchQuery.length >= 2 && userData?.user?._id
      ? { userId: userData.user._id, query: searchQuery }
      : "skip"
  );

  // Notes by tag
  const notesByTag = useQuery(
    api.notes.getNotesByTag,
    selectedTag && userData?.user?._id
      ? { userId: userData.user._id, tag: selectedTag }
      : "skip"
  );

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // Determine which notes to display
  let displayNotes = notes || [];
  if (searchQuery.length >= 2 && searchResults) {
    displayNotes = searchResults;
  } else if (selectedTag && notesByTag) {
    displayNotes = notesByTag;
  } else if (viewMode === "pinned" && pinnedNotes) {
    displayNotes = pinnedNotes;
  }

  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;
    
    await createNote({
      userId: userData.user._id,
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      tags: newNote.tags ? newNote.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      source: "manual",
    });
    
    setNewNote({ title: "", content: "", tags: "" });
    setIsCreating(false);
  };

  const handleTogglePin = async (noteId: Id<"notes">) => {
    await togglePin({ noteId });
  };

  const handleArchive = async (noteId: Id<"notes">) => {
    await archiveNote({ noteId });
  };

  const handleDelete = async (noteId: Id<"notes">) => {
    await deleteNote({ noteId });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="min-h-dvh p-6 safe-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white text-glow">Notes</h1>
            <p className="text-white/50 mt-1">Your personal knowledge base</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-3 rounded-full glass-button glass-accent hover:glow-accent transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </motion.header>

      {/* Search Bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your notes..."
            className="w-full pl-12 pr-4 py-3 rounded-xl glass-card bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Tags Filter */}
      {tags && tags.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                !selectedTag ? "glass-accent" : "glass-button"
              }`}
            >
              All
            </button>
            {tags.slice(0, 8).map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  selectedTag === tag ? "glass-accent" : "glass-button"
                }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
                <span className="text-white/40">({count})</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* View Mode Toggle */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 mb-6"
      >
        <button
          onClick={() => setViewMode("all")}
          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
            viewMode === "all" ? "glass-accent" : "glass-button"
          }`}
        >
          All Notes
        </button>
        <button
          onClick={() => setViewMode("pinned")}
          className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all ${
            viewMode === "pinned" ? "glass-accent" : "glass-button"
          }`}
        >
          <Pin className="w-3 h-3" />
          Pinned
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{notes?.length || 0}</p>
          <p className="text-xs text-white/50">Total Notes</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-accent">{pinnedNotes?.length || 0}</p>
          <p className="text-xs text-white/50">Pinned</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{tags?.length || 0}</p>
          <p className="text-xs text-white/50">Tags</p>
        </div>
      </motion.div>

      {/* Create Note Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-card p-6 space-y-4"
            >
              <h2 className="text-xl font-bold text-white">New Note</h2>
              
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Title"
                className="w-full px-4 py-3 rounded-xl glass-card bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
                autoFocus
              />
              
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Write your note..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl glass-card bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              />
              
              <input
                type="text"
                value={newNote.tags}
                onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                placeholder="Tags (comma separated)"
                className="w-full px-4 py-3 rounded-xl glass-card bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 rounded-xl glass-button text-white/70"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={!newNote.title.trim() || !newNote.content.trim()}
                  className="flex-1 py-3 rounded-xl glass-accent glow-accent text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {displayNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-card flex items-center justify-center">
                <FileText className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50">
                {searchQuery
                  ? "No notes found"
                  : selectedTag
                  ? `No notes with tag "${selectedTag}"`
                  : "No notes yet!"}
              </p>
              <p className="text-white/30 text-sm mt-1">
                {searchQuery
                  ? "Try a different search term"
                  : "Create one above or save something in chat"}
              </p>
            </motion.div>
          ) : (
            displayNotes.map((note, index) => {
              const isExpanded = expandedNote === note._id;
              const SourceIcon = SOURCE_CONFIG[note.source || "manual"]?.icon || FileText;
              const sourceConfig = SOURCE_CONFIG[note.source || "manual"];

              return (
                <motion.div
                  key={note._id}
                  layout
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card overflow-hidden ${
                    note.isPinned ? "border-accent/30" : ""
                  }`}
                >
                  {/* Note Header */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedNote(isExpanded ? null : note._id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Pin indicator */}
                      {note.isPinned && (
                        <Pin className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {note.title}
                        </h3>
                        
                        {/* Preview */}
                        <p className={`text-white/60 text-sm mt-1 ${isExpanded ? "" : "line-clamp-2"}`}>
                          {note.content}
                        </p>
                        
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {/* Source */}
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${sourceConfig?.color || "bg-white/10"}`}>
                            <SourceIcon className="w-3 h-3" />
                            {sourceConfig?.label}
                          </span>
                          
                          {/* Date */}
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(note.createdAt)}
                          </span>
                          
                          {/* Tags */}
                          {note.tags && note.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag(tag);
                              }}
                              className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 cursor-pointer"
                            >
                              #{tag}
                            </span>
                          ))}
                          {note.tags && note.tags.length > 3 && (
                            <span className="text-xs text-white/40">
                              +{note.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Expand indicator */}
                      <ChevronDown
                        className={`w-5 h-5 text-white/30 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                  
                  {/* Expanded Actions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-3 flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePin(note._id)}
                            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                              note.isPinned
                                ? "glass-accent text-accent"
                                : "glass-button text-white/70 hover:text-white"
                            }`}
                          >
                            <Pin className="w-4 h-4" />
                            {note.isPinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            onClick={() => handleArchive(note._id)}
                            className="flex-1 py-2 rounded-lg glass-button text-white/70 hover:text-white flex items-center justify-center gap-2"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                          <button
                            onClick={() => handleDelete(note._id)}
                            className="flex-1 py-2 rounded-lg glass-button text-white/70 hover:text-red-400 flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating AI Tip */}
      {displayNotes.length === 0 && !searchQuery && !selectedTag && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass-card glass-accent p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Tip from Nous</p>
              <p className="text-xs text-white/60">
                You can tell me &quot;remember this...&quot; or &quot;save this note&quot; in chat and I&apos;ll save it here for you!
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
