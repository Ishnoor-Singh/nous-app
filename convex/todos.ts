import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all todos for a user
export const getTodos = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get incomplete todos
export const getIncompleteTodos = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return todos.filter(t => !t.completed);
  },
});

// Get todos due today
export const getTodayTodos = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    return await ctx.db
      .query("todos")
      .withIndex("by_user_due", (q) => q.eq("userId", args.userId).eq("dueDate", today))
      .collect();
  },
});

// Create a new todo
export const createTodo = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    )),
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    nousReminder: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("todos", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      priority: args.priority || "medium",
      dueDate: args.dueDate,
      dueTime: args.dueTime,
      completed: false,
      nousReminder: args.nousReminder ?? true,
      createdAt: Date.now(),
    });
  },
});

// Update a todo
export const updateTodo = mutation({
  args: {
    todoId: v.id("todos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    )),
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    nousReminder: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { todoId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(todoId, filtered);
  },
});

// Complete a todo
export const completeTodo = mutation({
  args: { todoId: v.id("todos") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.todoId, {
      completed: true,
      completedAt: Date.now(),
    });
  },
});

// Uncomplete a todo
export const uncompleteTodo = mutation({
  args: { todoId: v.id("todos") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.todoId, {
      completed: false,
      completedAt: undefined,
    });
  },
});

// Delete a todo
export const deleteTodo = mutation({
  args: { todoId: v.id("todos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.todoId);
  },
});

// Get summary for AI context
export const getSummaryForAI = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    
    const allTodos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const incomplete = allTodos.filter(t => !t.completed);
    const completed = allTodos.filter(t => t.completed);
    const overdue = incomplete.filter(t => t.dueDate && t.dueDate < today);
    const dueToday = incomplete.filter(t => t.dueDate === today);
    const highPriority = incomplete.filter(t => t.priority === "high");
    
    return {
      total: allTodos.length,
      incomplete: incomplete.length,
      completed: completed.length,
      overdue: overdue.length,
      dueToday: dueToday.length,
      highPriority: highPriority.length,
      items: incomplete.slice(0, 10).map(t => ({
        id: t._id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
        description: t.description,
      })),
    };
  },
});
