"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ChevronRight,
  Plus,
  Search,
  Pin,
  MoreHorizontal,
  Trash2,
  FolderPlus,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface NoteTreeItem {
  _id: Id<"notes">;
  title: string;
  icon?: string;
  parentId?: Id<"notes">;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

interface NoteSidebarProps {
  notes: NoteTreeItem[];
  selectedNoteId?: Id<"notes">;
  onSelectNote: (noteId: Id<"notes">) => void;
  onCreateNote: (parentId?: Id<"notes">) => void;
  onDeleteNote: (noteId: Id<"notes">) => void;
}

export default function NoteSidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
}: NoteSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    noteId: Id<"notes">;
    x: number;
    y: number;
  } | null>(null);

  // Build tree structure
  const { rootNotes, childrenMap, pinnedNotes } = useMemo(() => {
    const childrenMap = new Map<string, NoteTreeItem[]>();
    const rootNotes: NoteTreeItem[] = [];
    const pinnedNotes: NoteTreeItem[] = [];

    for (const note of notes) {
      if (note.isPinned) {
        pinnedNotes.push(note);
      }
      
      if (note.parentId) {
        const children = childrenMap.get(note.parentId) || [];
        children.push(note);
        childrenMap.set(note.parentId, children);
      } else {
        rootNotes.push(note);
      }
    }

    return { rootNotes, childrenMap, pinnedNotes };
  }, [notes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return rootNotes;
    
    const query = searchQuery.toLowerCase();
    return notes.filter((note) =>
      note.title.toLowerCase().includes(query)
    );
  }, [notes, rootNotes, searchQuery]);

  const toggleExpand = (noteId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, noteId: Id<"notes">) => {
    e.preventDefault();
    setContextMenu({
      noteId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Close context menu on click elsewhere
  const handleCloseContextMenu = () => setContextMenu(null);

  return (
    <div className="h-full flex flex-col" onClick={handleCloseContextMenu}>
      {/* Search */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
      </div>

      {/* New Note Button */}
      <div className="p-3 border-b border-white/10">
        <button
          onClick={() => onCreateNote()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Note</span>
        </button>
      </div>

      {/* Notes Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Pinned Section */}
        {pinnedNotes.length > 0 && !searchQuery && (
          <div className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-white/40 font-medium uppercase tracking-wide">
              <Pin className="w-3 h-3" />
              Pinned
            </div>
            {pinnedNotes.map((note) => (
              <NoteItem
                key={`pinned-${note._id}`}
                note={note}
                isSelected={selectedNoteId === note._id}
                onClick={() => onSelectNote(note._id)}
                onContextMenu={(e) => handleContextMenu(e, note._id)}
              />
            ))}
          </div>
        )}

        {/* All Notes */}
        <div className="mb-4">
          {!searchQuery && (
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-white/40 font-medium uppercase tracking-wide">
              <FileText className="w-3 h-3" />
              All Notes
            </div>
          )}
          
          {filteredNotes.length === 0 ? (
            <div className="px-2 py-4 text-center text-white/40 text-sm">
              {searchQuery ? "No notes found" : "No notes yet"}
            </div>
          ) : (
            filteredNotes.map((note) => (
              <NoteTreeNode
                key={note._id}
                note={note}
                childrenMap={childrenMap}
                expandedNodes={expandedNodes}
                selectedNoteId={selectedNoteId}
                onToggleExpand={toggleExpand}
                onSelectNote={onSelectNote}
                onContextMenu={handleContextMenu}
                isSearching={!!searchQuery}
              />
            ))
          )}
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 100,
            }}
            className="glass-card border border-white/10 rounded-lg p-1 shadow-xl min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onCreateNote(contextMenu.noteId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              <FolderPlus className="w-4 h-4" />
              Add sub-page
            </button>
            <button
              onClick={() => {
                onDeleteNote(contextMenu.noteId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NoteTreeNode({
  note,
  childrenMap,
  expandedNodes,
  selectedNoteId,
  onToggleExpand,
  onSelectNote,
  onContextMenu,
  isSearching,
  depth = 0,
}: {
  note: NoteTreeItem;
  childrenMap: Map<string, NoteTreeItem[]>;
  expandedNodes: Set<string>;
  selectedNoteId?: Id<"notes">;
  onToggleExpand: (noteId: string) => void;
  onSelectNote: (noteId: Id<"notes">) => void;
  onContextMenu: (e: React.MouseEvent, noteId: Id<"notes">) => void;
  isSearching: boolean;
  depth?: number;
}) {
  const children = childrenMap.get(note._id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(note._id);

  return (
    <div>
      <NoteItem
        note={note}
        isSelected={selectedNoteId === note._id}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        depth={depth}
        onClick={() => onSelectNote(note._id)}
        onToggle={() => onToggleExpand(note._id)}
        onContextMenu={(e) => onContextMenu(e, note._id)}
      />
      
      {hasChildren && isExpanded && !isSearching && (
        <div className="ml-2">
          {children.map((child) => (
            <NoteTreeNode
              key={child._id}
              note={child}
              childrenMap={childrenMap}
              expandedNodes={expandedNodes}
              selectedNoteId={selectedNoteId}
              onToggleExpand={onToggleExpand}
              onSelectNote={onSelectNote}
              onContextMenu={onContextMenu}
              isSearching={isSearching}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteItem({
  note,
  isSelected,
  hasChildren = false,
  isExpanded = false,
  depth = 0,
  onClick,
  onToggle,
  onContextMenu,
}: {
  note: NoteTreeItem;
  isSelected: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  depth?: number;
  onClick: () => void;
  onToggle?: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? "bg-accent/20 text-white"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
      style={{ paddingLeft: `${8 + depth * 16}px` }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* Expand/Collapse */}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="p-0.5 rounded hover:bg-white/10"
        >
          <ChevronRight
            className={`w-3.5 h-3.5 text-white/40 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </button>
      ) : (
        <div className="w-4" />
      )}
      
      {/* Icon */}
      <span className="text-base flex-shrink-0">
        {note.icon || "📄"}
      </span>
      
      {/* Title */}
      <span className="flex-1 text-sm truncate">
        {note.title || "Untitled"}
      </span>
      
      {/* Pin indicator */}
      {note.isPinned && (
        <Pin className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100" />
      )}
    </div>
  );
}
