"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X, HelpCircle } from "lucide-react";

const shortcuts = [
  { keys: ["/"], description: "Open command menu" },
  { keys: ["Cmd", "B"], description: "Bold" },
  { keys: ["Cmd", "I"], description: "Italic" },
  { keys: ["Cmd", "U"], description: "Underline" },
  { keys: ["Cmd", "E"], description: "Code" },
  { keys: ["Cmd", "Shift", "H"], description: "Highlight" },
  { keys: ["Cmd", "K"], description: "Add link" },
  { keys: ["Cmd", "S"], description: "Save" },
];

const markdownShortcuts = [
  { syntax: "# ", description: "Heading 1" },
  { syntax: "## ", description: "Heading 2" },
  { syntax: "### ", description: "Heading 3" },
  { syntax: "- ", description: "Bullet list" },
  { syntax: "1. ", description: "Numbered list" },
  { syntax: "> ", description: "Quote" },
  { syntax: "```", description: "Code block" },
  { syntax: "---", description: "Divider" },
  { syntax: "[[title]]", description: "Link to note" },
];

export default function EditorHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 rounded-full glass-card border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all z-40"
        title="Keyboard shortcuts"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {/* Help Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass-card p-6 space-y-6 max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Editor Help</h2>
                    <p className="text-sm text-white/50">Shortcuts & syntax</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-accent" />
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                    >
                      <span className="text-sm text-white/70">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <kbd
                            key={j}
                            className="px-2 py-1 text-xs bg-white/10 rounded border border-white/20 text-white/80"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Markdown Shortcuts */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">
                  Markdown Shortcuts
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {markdownShortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                    >
                      <code className="px-2 py-0.5 text-xs bg-accent/20 text-accent rounded font-mono">
                        {shortcut.syntax}
                      </code>
                      <span className="text-xs text-white/60">{shortcut.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <h3 className="text-sm font-semibold text-accent mb-2">💡 Pro Tips</h3>
                <ul className="space-y-1 text-sm text-white/70">
                  <li>• Type <code className="text-accent">[[note title]]</code> to link to other notes</li>
                  <li>• Press <code className="text-accent">/</code> at the start of a line for the command menu</li>
                  <li>• Select text to see the formatting toolbar</li>
                  <li>• AI assistant can help continue your writing</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
