"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect, useCallback } from "react";
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
  Trash2,
  X,
  ChevronDown,
  Image as ImageIcon,
  PanelRightClose,
  PanelRightOpen,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { BlockEditor, NoteSidebar, AIAssistant, BacklinksPanel } from "@/components/editor";
import ImageUpload from "@/components/ImageUpload";

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

export default function NotesPage() {
  const { user } = useUser();
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  if (isDesktop) {
    return <DesktopNotesView />;
  }
  
  return <MobileNotesView />;
}

// ============================================
// DESKTOP VIEW - Notion-like layout
// ============================================
function DesktopNotesView() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });

  const notesTree = useQuery(api.notes.getNotesTree, {
    userId: userData?.user?._id || ("" as any),
  });

  const [selectedNoteId, setSelectedNoteId] = useState<Id<"notes"> | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const selectedNote = useQuery(
    api.notes.getNote,
    selectedNoteId ? { noteId: selectedNoteId } : "skip"
  );

  const backlinks = useQuery(
    api.notes.getBacklinks,
    selectedNoteId ? { noteId: selectedNoteId } : "skip"
  );

  const createNote = useMutation(api.notes.createNoteWithBlocks);
  const updateBlocks = useMutation(api.notes.updateNoteBlocks);
  const updateMeta = useMutation(api.notes.updateNoteMeta);
  const deleteNote = useMutation(api.notes.deleteNote);
  const togglePin = useMutation(api.notes.togglePinNote);

  // Auto-select first note if none selected
  useEffect(() => {
    if (!selectedNoteId && notesTree && notesTree.length > 0) {
      setSelectedNoteId(notesTree[0]._id);
    }
  }, [notesTree, selectedNoteId]);

  const handleCreateNote = async (parentId?: Id<"notes">) => {
    if (!userData?.user?._id) return;
    
    const noteId = await createNote({
      userId: userData.user._id,
      title: "Untitled",
      parentId,
    });
    
    setSelectedNoteId(noteId);
  };

  const handleDeleteNote = async (noteId: Id<"notes">) => {
    await deleteNote({ noteId });
    if (selectedNoteId === noteId) {
      const remaining = notesTree?.filter((n) => n._id !== noteId);
      setSelectedNoteId(remaining?.[0]?._id || null);
    }
  };

  const updateBacklinks = useMutation(api.notes.updateBacklinks);
  const findNoteByTitle = useQuery(api.notes.findNoteByTitle, "skip"); // We'll call this manually

  const handleEditorChange = useCallback(
    async (json: any, text: string, wikiLinks?: string[]) => {
      if (!selectedNoteId) return;
      await updateBlocks({
        noteId: selectedNoteId,
        blocks: json,
        content: text,
      });
      
      // If wiki links detected, resolve them and update backlinks
      // Note: For now, wiki links are stored in the content and rendered
      // Full backlink resolution would require a server-side function
    },
    [selectedNoteId, updateBlocks]
  );

  const handleTitleChange = useCallback(
    async (title: string) => {
      if (!selectedNoteId) return;
      await updateMeta({
        noteId: selectedNoteId,
        title,
      });
    },
    [selectedNoteId, updateMeta]
  );

  const handleIconChange = useCallback(
    async (icon: string) => {
      if (!selectedNoteId) return;
      await updateMeta({
        noteId: selectedNoteId,
        icon,
      });
    },
    [selectedNoteId, updateMeta]
  );

  // Handle wiki link clicks - find note by title and navigate
  const handleWikiLinkClick = useCallback(
    (noteTitle: string) => {
      if (!notesTree) return;
      
      // Find note with matching title (case-insensitive)
      const targetNote = notesTree.find(
        (n) => n.title.toLowerCase() === noteTitle.toLowerCase()
      );
      
      if (targetNote) {
        setSelectedNoteId(targetNote._id);
      } else {
        // Note doesn't exist - could prompt to create it
        if (confirm(`Note "${noteTitle}" doesn't exist. Create it?`)) {
          handleCreateNote().then(() => {
            // Update the new note's title
            // This is a bit hacky - ideally we'd pass the title to createNote
          });
        }
      }
    },
    [notesTree, handleCreateNote]
  );

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-0px)] flex overflow-hidden -mx-4 lg:-mx-0 lg:-ml-64">
      {/* Left Sidebar - Notes Tree */}
      <div className="w-64 flex-shrink-0 glass-nav border-r border-white/10">
        <NoteSidebar
          notes={notesTree || []}
          selectedNoteId={selectedNoteId || undefined}
          onSelectNote={setSelectedNoteId}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
        />
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedNote ? (
          <>
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 glass-nav">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/40">Notes</span>
                <span className="text-white/40">/</span>
                <span className="text-white font-medium truncate max-w-[200px]">
                  {selectedNote.title || "Untitled"}
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePin({ noteId: selectedNoteId! })}
                  className={`p-2 rounded-lg transition-all ${
                    selectedNote.isPinned
                      ? "bg-accent/20 text-accent"
                      : "hover:bg-white/10 text-white/50"
                  }`}
                  title={selectedNote.isPinned ? "Unpin" : "Pin"}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAiPanelOpen(!aiPanelOpen)}
                  className={`p-2 rounded-lg transition-all ${
                    aiPanelOpen
                      ? "bg-accent/20 text-accent"
                      : "hover:bg-white/10 text-white/50"
                  }`}
                  title="AI Assistant"
                >
                  {aiPanelOpen ? (
                    <PanelRightClose className="w-4 h-4" />
                  ) : (
                    <PanelRightOpen className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Editor Container */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-8">
                {/* Icon + Title */}
                <div className="mb-6">
                  {/* Icon picker */}
                  <div className="mb-2">
                    <button
                      onClick={() => {
                        const emoji = prompt("Enter an emoji for this note:", selectedNote.icon || "📄");
                        if (emoji) handleIconChange(emoji);
                      }}
                      className="text-4xl hover:bg-white/10 p-2 rounded-lg transition-all"
                      title="Change icon"
                    >
                      {selectedNote.icon || "📄"}
                    </button>
                  </div>
                  
                  {/* Title */}
                  <input
                    type="text"
                    value={selectedNote.title || ""}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Untitled"
                    className="w-full text-4xl font-bold text-white bg-transparent border-none outline-none placeholder-white/30"
                  />
                  
                  {/* Meta info */}
                  <div className="flex items-center gap-4 mt-2 text-sm text-white/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(selectedNote.updatedAt).toLocaleDateString()}
                    </span>
                    {selectedNote.tags && selectedNote.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {selectedNote.tags.join(", ")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Block Editor */}
                <BlockEditor
                  content={selectedNote.blocks || selectedNote.content}
                  onChange={handleEditorChange}
                  onWikiLinkClick={handleWikiLinkClick}
                  placeholder="Start writing, or press '/' for commands. Use [[note title]] to link notes..."
                />

                {/* Backlinks */}
                {backlinks && backlinks.length > 0 && (
                  <BacklinksPanel
                    backlinks={backlinks as any}
                    onNavigate={(noteId) => setSelectedNoteId(noteId)}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-card flex items-center justify-center">
                <FileText className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50 mb-4">Select a note or create a new one</p>
              <button
                onClick={() => handleCreateNote()}
                className="px-4 py-2 rounded-lg glass-accent text-white text-sm flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                New Note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - AI Assistant */}
      <AnimatePresence>
        {aiPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 overflow-hidden"
          >
            <AIAssistant
              noteTitle={selectedNote?.title || ""}
              noteContent={selectedNote?.content || ""}
              isCollapsed={false}
              onToggle={() => setAiPanelOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MOBILE VIEW - Original card-based layout
// ============================================
type ViewMode = "all" | "pinned" | "archived";

function MobileNotesView() {
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
  const togglePin = useMutation(api.notes.togglePinNote);
  const archiveNote = useMutation(api.notes.archiveNote);
  const deleteNote = useMutation(api.notes.deleteNote);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
  const [newNoteAttachment, setNewNoteAttachment] = useState<{
    storageId: Id<"_storage">;
    url: string;
    type: string;
    mimeType: string;
    name: string;
    size: number;
  } | null>(null);
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
      attachments: newNoteAttachment ? [{
        storageId: newNoteAttachment.storageId,
        url: newNoteAttachment.url,
        type: newNoteAttachment.type,
        mimeType: newNoteAttachment.mimeType,
        name: newNoteAttachment.name,
        size: newNoteAttachment.size,
      }] : undefined,
    });
    
    setNewNote({ title: "", content: "", tags: "" });
    setNewNoteAttachment(null);
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
              
              {/* Image Upload */}
              <div>
                <p className="text-sm text-white/50 mb-2">Attach image (optional)</p>
                <ImageUpload
                  onUpload={(file) => setNewNoteAttachment(file)}
                  onRemove={() => setNewNoteAttachment(null)}
                  preview={newNoteAttachment?.url}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewNoteAttachment(null);
                  }}
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
                        
                        {/* Attachments */}
                        {note.attachments && note.attachments.length > 0 && (
                          <div className={`mt-2 ${isExpanded ? "" : "max-h-20 overflow-hidden"}`}>
                            {note.attachments.map((att, i) => (
                              att.type === "image" && att.url && (
                                <img
                                  key={i}
                                  src={att.url}
                                  alt={att.name || "Attachment"}
                                  className={`rounded-lg object-cover ${
                                    isExpanded ? "max-h-64 w-full" : "max-h-20 w-auto"
                                  }`}
                                />
                              )
                            ))}
                          </div>
                        )}
                        
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
                          
                          {/* Attachment indicator */}
                          {note.attachments && note.attachments.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {note.attachments.length}
                            </span>
                          )}
                          
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
