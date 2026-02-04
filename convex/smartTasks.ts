import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============ PROJECTS ============

// Get all projects for a user
export const getProjects = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get active projects only
export const getActiveProjects = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect();
  },
});

// Create a project
export const createProject = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      color: args.color || "#6366f1", // Default indigo
      icon: args.icon || "📁",
      status: "active",
      totalTasks: 0,
      completedTasks: 0,
      dueDate: args.dueDate,
      createdAt: Date.now(),
    });
  },
});

// Update project task counts
export const updateProjectCounts = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("todos")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    
    await ctx.db.patch(args.projectId, {
      totalTasks: total,
      completedTasks: completed,
      status: total > 0 && total === completed ? "completed" : "active",
      completedAt: total > 0 && total === completed ? Date.now() : undefined,
    });
  },
});

// Archive a project
export const archiveProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { status: "archived" });
  },
});

// ============ QUICK CAPTURE ============

// Save a quick capture (inbox item)
export const quickCapture = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quickCapture", {
      userId: args.userId,
      content: args.content,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Get pending captures
export const getPendingCaptures = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quickCapture")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "pending")
      )
      .collect();
  },
});

// Update capture with parsed data
export const updateCaptureParsed = mutation({
  args: {
    captureId: v.id("quickCapture"),
    parsedType: v.union(
      v.literal("task"),
      v.literal("note"),
      v.literal("reminder"),
      v.literal("idea"),
      v.literal("unknown"),
    ),
    parsedData: v.object({
      title: v.optional(v.string()),
      dueDate: v.optional(v.string()),
      dueTime: v.optional(v.string()),
      priority: v.optional(v.string()),
      context: v.optional(v.string()),
      project: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.captureId, {
      parsedType: args.parsedType,
      parsedData: args.parsedData,
    });
  },
});

// Process capture into a todo
export const processCaptureAsTodo = mutation({
  args: {
    captureId: v.id("quickCapture"),
    userId: v.id("users"),
    title: v.string(),
    priority: v.optional(v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    )),
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    context: v.optional(v.union(
      v.literal("home"),
      v.literal("work"),
      v.literal("errands"),
      v.literal("phone"),
      v.literal("computer"),
      v.literal("anywhere"),
    )),
    projectId: v.optional(v.id("projects")),
    estimatedMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Create the todo
    const todoId = await ctx.db.insert("todos", {
      userId: args.userId,
      title: args.title,
      priority: args.priority || "medium",
      dueDate: args.dueDate,
      dueTime: args.dueTime,
      context: args.context,
      projectId: args.projectId,
      estimatedMinutes: args.estimatedMinutes,
      completed: false,
      nousReminder: true,
      createdAt: Date.now(),
    });
    
    // Mark capture as processed
    await ctx.db.patch(args.captureId, {
      status: "processed",
      processedAs: "todo",
      linkedId: todoId,
      processedAt: Date.now(),
    });
    
    // Update project counts if applicable
    if (args.projectId) {
      const tasks = await ctx.db
        .query("todos")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
      
      await ctx.db.patch(args.projectId, {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
      });
    }
    
    return todoId;
  },
});

// Dismiss a capture
export const dismissCapture = mutation({
  args: { captureId: v.id("quickCapture") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.captureId, {
      status: "dismissed",
      processedAs: "dismissed",
      processedAt: Date.now(),
    });
  },
});

// ============ SMART TASK QUERIES ============

// Get tasks by context
export const getTasksByContext = query({
  args: { 
    userId: v.id("users"),
    context: v.union(
      v.literal("home"),
      v.literal("work"),
      v.literal("errands"),
      v.literal("phone"),
      v.literal("computer"),
      v.literal("anywhere"),
    ),
  },
  handler: async (ctx, args) => {
    const allTasks = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    return allTasks.filter(t => 
      !t.completed && 
      (t.context === args.context || t.context === "anywhere" || !t.context)
    );
  },
});

// Get tasks for a project
export const getProjectTasks = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("todos")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get available tasks (not blocked)
export const getAvailableTasks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allTasks = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const incompleteTasks = allTasks.filter(t => !t.completed);
    const incompleteIds = new Set(incompleteTasks.map(t => t._id));
    
    // A task is available if all its blockers are complete
    return incompleteTasks.filter(task => {
      if (!task.blockedBy || task.blockedBy.length === 0) return true;
      return task.blockedBy.every(blockerId => !incompleteIds.has(blockerId));
    });
  },
});

// Get smart suggestions (what to do next)
export const getSmartSuggestions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const hour = now.getHours();
    
    const allTasks = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const incomplete = allTasks.filter(t => !t.completed);
    const incompleteIds = new Set(incomplete.map(t => t._id));
    
    // Filter to available tasks (not blocked)
    const available = incomplete.filter(task => {
      if (!task.blockedBy || task.blockedBy.length === 0) return true;
      return task.blockedBy.every(blockerId => !incompleteIds.has(blockerId));
    });
    
    // Score each task
    const scored = available.map(task => {
      let score = 0;
      
      // Priority scoring
      if (task.priority === "high") score += 30;
      else if (task.priority === "medium") score += 15;
      else score += 5;
      
      // Due date scoring
      if (task.dueDate) {
        if (task.dueDate < today) score += 50; // Overdue!
        else if (task.dueDate === today) score += 40;
        else {
          const daysUntil = Math.ceil(
            (new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntil <= 3) score += 20;
          else if (daysUntil <= 7) score += 10;
        }
      }
      
      // Energy matching (morning = high energy, afternoon = medium, evening = low)
      const preferredEnergy = hour < 12 ? "high" : hour < 17 ? "medium" : "low";
      if (task.energyRequired === preferredEnergy) score += 10;
      
      // Quick wins bonus (tasks < 15 min)
      if (task.estimatedMinutes && task.estimatedMinutes <= 15) score += 5;
      
      return { task, score };
    });
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    return {
      topPick: scored[0]?.task || null,
      suggestions: scored.slice(0, 5).map(s => s.task),
      overdue: incomplete.filter(t => t.dueDate && t.dueDate < today),
      dueToday: incomplete.filter(t => t.dueDate === today),
      quickWins: available.filter(t => t.estimatedMinutes && t.estimatedMinutes <= 15).slice(0, 3),
    };
  },
});

// ============ RECURRING TASKS ============

// Generate next occurrence of recurring task
export const generateRecurringOccurrence = mutation({
  args: { templateTaskId: v.id("todos") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateTaskId);
    if (!template || !template.isRecurring || !template.recurrence) {
      throw new Error("Not a recurring task template");
    }
    
    const { pattern, interval = 1, daysOfWeek, dayOfMonth, endDate } = template.recurrence;
    
    // Calculate next date
    let nextDate = new Date(template.dueDate || new Date());
    
    switch (pattern) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case "weekdays":
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + (7 * interval));
        break;
      case "biweekly":
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + interval);
        if (dayOfMonth) {
          nextDate.setDate(Math.min(dayOfMonth, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
        }
        break;
    }
    
    const nextDateStr = nextDate.toISOString().split("T")[0];
    
    // Check if past end date
    if (endDate && nextDateStr > endDate) {
      return null;
    }
    
    // Create the occurrence
    return await ctx.db.insert("todos", {
      userId: template.userId,
      title: template.title,
      description: template.description,
      priority: template.priority,
      dueDate: nextDateStr,
      dueTime: template.dueTime,
      context: template.context,
      projectId: template.projectId,
      estimatedMinutes: template.estimatedMinutes,
      energyRequired: template.energyRequired,
      completed: false,
      nousReminder: template.nousReminder,
      parentTaskId: args.templateTaskId,
      createdAt: Date.now(),
    });
  },
});

// Get summary for AI (enhanced)
export const getEnhancedSummaryForAI = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    
    const [allTodos, projects, captures] = await Promise.all([
      ctx.db.query("todos").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("quickCapture").withIndex("by_user_status", (q) => q.eq("userId", args.userId).eq("status", "pending")).collect(),
    ]);
    
    const incomplete = allTodos.filter(t => !t.completed);
    const overdue = incomplete.filter(t => t.dueDate && t.dueDate < today);
    const dueToday = incomplete.filter(t => t.dueDate === today);
    const highPriority = incomplete.filter(t => t.priority === "high");
    
    // Group by context
    const byContext: Record<string, number> = {};
    incomplete.forEach(t => {
      const ctx = t.context || "unassigned";
      byContext[ctx] = (byContext[ctx] || 0) + 1;
    });
    
    return {
      tasks: {
        total: allTodos.length,
        incomplete: incomplete.length,
        completed: allTodos.length - incomplete.length,
        overdue: overdue.length,
        dueToday: dueToday.length,
        highPriority: highPriority.length,
        byContext,
      },
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === "active").length,
        list: projects.filter(p => p.status === "active").map(p => ({
          name: p.name,
          progress: p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0,
          remaining: p.totalTasks - p.completedTasks,
        })),
      },
      inbox: {
        pending: captures.length,
        items: captures.slice(0, 5).map(c => c.content),
      },
      topItems: [
        ...overdue.slice(0, 2).map(t => `⚠️ OVERDUE: ${t.title}`),
        ...dueToday.slice(0, 2).map(t => `📅 Today: ${t.title}`),
        ...highPriority.filter(t => !t.dueDate || t.dueDate > today).slice(0, 2).map(t => `🔴 High: ${t.title}`),
      ],
    };
  },
});
