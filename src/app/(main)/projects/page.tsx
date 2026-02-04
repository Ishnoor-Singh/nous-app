"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FolderKanban,
  ChevronRight,
  Check,
  Archive,
  MoreHorizontal,
  X,
  Palette,
} from "lucide-react";
import Link from "next/link";

const PROJECT_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Pink", value: "#ec4899" },
  { name: "Green", value: "#22c55e" },
  { name: "Orange", value: "#f97316" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Purple", value: "#a855f7" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#eab308" },
];

const PROJECT_ICONS = ["📁", "🎯", "🚀", "💡", "🏠", "💼", "📚", "🎨", "🔬", "🌱"];

export default function ProjectsPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });

  const projects = useQuery(api.smartTasks.getProjects, {
    userId: userData?.user?._id || ("" as any),
  });

  const createProject = useMutation(api.smartTasks.createProject);
  const archiveProject = useMutation(api.smartTasks.archiveProject);

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    icon: "📁",
  });

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const activeProjects = projects?.filter((p) => p.status === "active") || [];
  const completedProjects = projects?.filter((p) => p.status === "completed") || [];
  const archivedProjects = projects?.filter((p) => p.status === "archived") || [];

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;
    
    await createProject({
      userId: userData.user._id,
      name: newProject.name,
      description: newProject.description || undefined,
      color: newProject.color,
      icon: newProject.icon,
    });
    
    setNewProject({ name: "", description: "", color: "#6366f1", icon: "📁" });
    setShowNewProject(false);
  };

  const handleArchive = async (projectId: any) => {
    await archiveProject({ projectId });
  };

  return (
    <main className="min-h-dvh p-6 safe-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-white text-glow">Projects</h1>
          <p className="text-white/50 mt-1">Organize your tasks</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="w-12 h-12 rounded-full glass-accent glow-accent flex items-center justify-center"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </motion.header>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowNewProject(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">New Project</h2>
                <button
                  onClick={() => setShowNewProject(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Icon & Name */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: newProject.color + "30" }}
                    >
                      {newProject.icon}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Project name"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent transition-colors"
                    autoFocus
                  />
                </div>

                {/* Description */}
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent transition-colors resize-none"
                />

                {/* Icon Picker */}
                <div>
                  <p className="text-sm text-white/50 mb-2">Icon</p>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewProject({ ...newProject, icon })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                          newProject.icon === icon
                            ? "bg-white/20 ring-2 ring-accent"
                            : "bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <p className="text-sm text-white/50 mb-2">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewProject({ ...newProject, color: color.value })}
                        className={`w-8 h-8 rounded-full transition-all ${
                          newProject.color === color.value
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0b]"
                            : ""
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleCreateProject}
                  disabled={!newProject.name.trim()}
                  className="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-medium"
                >
                  Create Project
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Projects */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-accent" />
          Active ({activeProjects.length})
        </h2>

        {activeProjects.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-card flex items-center justify-center">
              <Plus className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50">No projects yet</p>
            <p className="text-white/30 text-sm mt-1">Create one to organize your tasks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeProjects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/tasks?project=${project._id}`}>
                  <div className="glass-card p-4 group hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: (project.color || "#6366f1") + "30" }}
                      >
                        {project.icon || "📁"}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-white/50 truncate">{project.description}</p>
                        )}
                        
                        {/* Progress */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                            <span>
                              {project.completedTasks} / {project.totalTasks} tasks
                            </span>
                            <span>
                              {project.totalTasks > 0
                                ? Math.round((project.completedTasks / project.totalTasks) * 100)
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${
                                  project.totalTasks > 0
                                    ? (project.completedTasks / project.totalTasks) * 100
                                    : 0
                                }%`,
                                backgroundColor: project.color || "#6366f1",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/70 transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white/70 mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            Completed ({completedProjects.length})
          </h2>

          <div className="space-y-3">
            {completedProjects.map((project) => (
              <div
                key={project._id}
                className="glass-card p-4 opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: (project.color || "#6366f1") + "20" }}
                  >
                    {project.icon || "📁"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white/70 line-through">{project.name}</p>
                    <p className="text-xs text-white/40">
                      {project.totalTasks} tasks completed
                    </p>
                  </div>
                  <button
                    onClick={() => handleArchive(project._id)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4 text-white/30" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <details className="group">
            <summary className="text-sm text-white/40 cursor-pointer hover:text-white/60 transition-colors mb-4 flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Archived ({archivedProjects.length})
            </summary>
            <div className="space-y-2">
              {archivedProjects.map((project) => (
                <div
                  key={project._id}
                  className="glass-card p-3 opacity-40"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{project.icon || "📁"}</span>
                    <span className="text-white/50 text-sm">{project.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </motion.section>
      )}
    </main>
  );
}
