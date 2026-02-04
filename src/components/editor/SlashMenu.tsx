"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
} from "lucide-react";

interface SlashMenuProps {
  position: { top: number; left: number };
  onSelect: (command: string) => void;
  onClose: () => void;
}

const commands = [
  { id: "h1", label: "Heading 1", description: "Large heading", icon: Heading1 },
  { id: "h2", label: "Heading 2", description: "Medium heading", icon: Heading2 },
  { id: "h3", label: "Heading 3", description: "Small heading", icon: Heading3 },
  { id: "bullet", label: "Bullet List", description: "Simple bullet list", icon: List },
  { id: "numbered", label: "Numbered List", description: "Numbered list", icon: ListOrdered },
  { id: "todo", label: "To-do List", description: "Track tasks", icon: CheckSquare },
  { id: "quote", label: "Quote", description: "Capture a quote", icon: Quote },
  { id: "code", label: "Code Block", description: "Code with syntax highlighting", icon: Code },
  { id: "divider", label: "Divider", description: "Visual divider", icon: Minus },
];

export default function SlashMenu({ position, onSelect, onClose }: SlashMenuProps) {
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex].id);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = { ...position };
  if (typeof window !== "undefined") {
    const menuHeight = 360; // approximate
    const menuWidth = 280;
    
    if (position.top + menuHeight > window.innerHeight) {
      adjustedPosition.top = position.top - menuHeight - 20;
    }
    if (position.left + menuWidth > window.innerWidth) {
      adjustedPosition.left = window.innerWidth - menuWidth - 20;
    }
  }

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        position: "fixed",
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        zIndex: 100,
      }}
      className="w-72 glass-card border border-white/10 rounded-xl overflow-hidden shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Input */}
      <div className="p-2 border-b border-white/10">
        <input
          ref={inputRef}
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Type to filter..."
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* Commands List */}
      <div className="max-h-64 overflow-y-auto p-1">
        {filteredCommands.length === 0 ? (
          <div className="p-4 text-center text-white/40 text-sm">
            No matching blocks
          </div>
        ) : (
          filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left ${
                index === selectedIndex
                  ? "bg-accent/20 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  index === selectedIndex ? "bg-accent/30" : "bg-white/10"
                }`}
              >
                <cmd.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{cmd.label}</p>
                <p className="text-xs text-white/40">{cmd.description}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 flex items-center justify-between text-xs text-white/30">
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>Esc Close</span>
      </div>
    </motion.div>
  );
}
