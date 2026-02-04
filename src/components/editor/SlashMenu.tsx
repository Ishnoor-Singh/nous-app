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
  filter?: string;
  selectedIndex?: number;
  onIndexChange?: (index: number) => void;
}

export const slashCommands = [
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

export default function SlashMenu({ 
  position, 
  onSelect, 
  onClose, 
  filter = "",
  selectedIndex: externalIndex,
  onIndexChange,
}: SlashMenuProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const selectedIndex = externalIndex ?? internalIndex;
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = slashCommands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  // Reset index when filter changes
  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(0);
    } else {
      setInternalIndex(0);
    }
  }, [filter, onIndexChange]);
  
  // Clamp index to valid range
  const clampedIndex = Math.min(selectedIndex, Math.max(0, filteredCommands.length - 1));

  // Keyboard handling is now done by the parent editor
  // This allows typing to continue in the editor while slash menu is open

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
      {/* Filter indicator */}
      {filter && (
        <div className="px-3 py-2 border-b border-white/10 text-sm text-white/50">
          Filtering: <span className="text-white">{filter}</span>
        </div>
      )}

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
                index === clampedIndex
                  ? "bg-accent/20 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  index === clampedIndex ? "bg-accent/30" : "bg-white/10"
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
