"use client";

import { motion } from "framer-motion";
import { Link2, FileText, ExternalLink } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface BacklinkItem {
  _id: Id<"notes">;
  title: string;
  icon?: string;
}

interface BacklinksPanelProps {
  backlinks: BacklinkItem[];
  onNavigate: (noteId: Id<"notes">) => void;
}

export default function BacklinksPanel({
  backlinks,
  onNavigate,
}: BacklinksPanelProps) {
  if (backlinks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 pt-6 border-t border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-white">
          Backlinks <span className="text-white/40">({backlinks.length})</span>
        </h3>
      </div>
      
      <div className="space-y-2">
        {backlinks.map((link) => (
          <button
            key={link._id}
            onClick={() => onNavigate(link._id)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-all group"
          >
            <span className="text-lg">{link.icon || "📄"}</span>
            <span className="flex-1 text-sm text-white/80 group-hover:text-white">
              {link.title || "Untitled"}
            </span>
            <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-accent" />
          </button>
        ))}
      </div>
      
      <p className="mt-4 text-xs text-white/30">
        These notes link to this page using [[{"{note title}"}]] syntax
      </p>
    </motion.div>
  );
}
