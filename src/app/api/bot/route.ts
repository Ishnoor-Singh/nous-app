import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ConvexHttpClient } from "convex/browser";
import { clerkClient } from "@clerk/nextjs/server";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

/**
 * BOT API - External Interface for Nous
 * 
 * This endpoint allows external bots (OpenClaw, etc.) to interact with Nous
 * using the same data as the web app.
 * 
 * Features:
 * - Message processing with full Nous personality
 * - Tool access (habits, todos, journal, etc.)
 * - User identification by phone number or email
 * - Proactive message support (bot can initiate)
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple API key auth for bot access
const BOT_API_KEY = process.env.NOUS_BOT_API_KEY || "nous-bot-dev-key";

// ===== TOOL DEFINITIONS (same as chat API) =====
const tools = [
  {
    type: "function" as const,
    function: {
      name: "get_habits",
      description: "Get the user's habits and today's progress",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_habit",
      description: "Create a new habit for the user to track daily",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the habit" },
          description: { type: "string", description: "Optional description" },
          icon: { type: "string", description: "Emoji icon for the habit" },
          category: { 
            type: "string", 
            enum: ["fitness", "nutrition", "mindfulness", "learning", "productivity", "health", "custom"],
            description: "Category of the habit"
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "log_habit",
      description: "Mark a habit as complete for today",
      parameters: {
        type: "object",
        properties: {
          habitName: { type: "string", description: "Name of the habit to log" },
          completed: { type: "boolean", description: "Whether completed" },
        },
        required: ["habitName"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_todos",
      description: "Get the user's tasks/todos",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_smart_task",
      description: "Create a task from natural language (auto-parses dates, priority, context). Use this for adding new tasks.",
      parameters: {
        type: "object",
        properties: {
          input: { type: "string", description: "Natural language task description, e.g. 'Call mom tomorrow at 3pm high priority @phone'" },
        },
        required: ["input"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "complete_todo",
      description: "Mark a task as complete",
      parameters: {
        type: "object",
        properties: {
          todoTitle: { type: "string", description: "Title of the task to complete" },
        },
        required: ["todoTitle"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_projects",
      description: "Get user's projects for task organization",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_project",
      description: "Create a new project to organize tasks",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name" },
          description: { type: "string", description: "Project description" },
          icon: { type: "string", description: "Emoji icon for the project" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_quick_wins",
      description: "Get quick tasks that can be done in 15 minutes or less",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_daily_summary",
      description: "Get a summary of today's progress (habits, todos, streaks)",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_journal_entry",
      description: "Add a journal entry for today",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The journal entry content" },
        },
        required: ["content"],
      },
    },
  },
  // ===== NOTE/KNOWLEDGE TOOLS =====
  {
    type: "function" as const,
    function: {
      name: "save_note",
      description: "Save a piece of knowledge, insight, or information. Use when user says 'remember this', 'note that', or shares something worth saving.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title for the note" },
          content: { type: "string", description: "The content to save" },
          tags: { type: "array", items: { type: "string" }, description: "Optional tags" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_notes",
      description: "Search the user's saved notes. Use when user asks to recall or find something they saved before.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_notes",
      description: "Get user's recent notes. Use when user asks to see their notes or knowledge base.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of notes to return (default 5)" },
        },
        required: [],
      },
    },
  },
];

// ===== EXECUTE TOOL CALLS =====
async function executeToolCall(
  name: string,
  args: Record<string, any>,
  userId: Id<"users">
): Promise<string> {
  try {
    switch (name) {
      case "get_habits": {
        const data = await convex.query(api.habits.getSummaryForAI, { userId });
        return JSON.stringify(data);
      }

      case "create_habit": {
        const habitId = await convex.mutation(api.habits.createHabit, {
          userId,
          name: args.name,
          description: args.description,
          icon: args.icon || "✨",
          category: args.category || "custom",
          trackingType: "boolean",
          frequency: "daily",
        });
        return JSON.stringify({ 
          success: true, 
          habitId, 
          message: `Created habit: ${args.icon || "✨"} ${args.name}` 
        });
      }

      case "log_habit": {
        // Find habit by name and log it
        const habits = await convex.query(api.habits.getHabits, { userId });
        const habit = habits.find((h: any) => 
          h.name.toLowerCase().includes(args.habitName.toLowerCase())
        );
        if (!habit) {
          return JSON.stringify({ error: `Habit "${args.habitName}" not found` });
        }
        await convex.mutation(api.habits.logHabit, {
          userId,
          habitId: habit._id,
          completed: args.completed ?? true,
        });
        return JSON.stringify({ success: true, message: `Logged ${habit.name}` });
      }

      case "get_todos": {
        const data = await convex.query(api.todos.getSummaryForAI, { userId });
        return JSON.stringify(data);
      }

      case "create_smart_task": {
        // Parse the natural language input first
        try {
          const parseResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'https://nous-app-gules.vercel.app'}/api/parse-task`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ input: args.input }),
            }
          );
          
          if (!parseResponse.ok) {
            // Fallback to simple creation
            const todoId = await convex.mutation(api.todos.createTodo, {
              userId,
              title: args.input,
              priority: "medium",
            });
            return JSON.stringify({ success: true, todoId, message: `Created: ${args.input}` });
          }
          
          const parsed = await parseResponse.json();
          
          const todoId = await convex.mutation(api.todos.createTodo, {
            userId,
            title: parsed.title || args.input,
            priority: parsed.priority || "medium",
            dueDate: parsed.dueDate || undefined,
            dueTime: parsed.dueTime || undefined,
          });
          
          let message = `Created: ${parsed.title}`;
          if (parsed.dueDate) message += ` (due ${parsed.dueDate}`;
          if (parsed.dueTime) message += ` at ${parsed.dueTime}`;
          if (parsed.dueDate) message += ')';
          if (parsed.context) message += ` [${parsed.context}]`;
          
          return JSON.stringify({ 
            success: true, 
            todoId, 
            message,
            parsed,
          });
        } catch (e) {
          // Fallback to simple creation
          const todoId = await convex.mutation(api.todos.createTodo, {
            userId,
            title: args.input,
            priority: "medium",
          });
          return JSON.stringify({ success: true, todoId, message: `Created: ${args.input}` });
        }
      }

      case "complete_todo": {
        const todos = await convex.query(api.todos.getTodos, { userId });
        const todo = todos.find((t: any) => 
          t.title.toLowerCase().includes(args.todoTitle.toLowerCase()) && !t.completed
        );
        if (!todo) {
          return JSON.stringify({ error: `Todo "${args.todoTitle}" not found` });
        }
        await convex.mutation(api.todos.completeTodo, { todoId: todo._id });
        return JSON.stringify({ success: true, message: `Completed: ${todo.title}` });
      }

      case "get_projects": {
        const projects = await convex.query(api.smartTasks.getProjects, { userId });
        return JSON.stringify({
          projects: projects.map((p: any) => ({
            name: p.name,
            icon: p.icon,
            status: p.status,
            totalTasks: p.totalTasks,
            completedTasks: p.completedTasks,
          })),
        });
      }

      case "create_project": {
        const projectId = await convex.mutation(api.smartTasks.createProject, {
          userId,
          name: args.name,
          description: args.description,
          icon: args.icon || "📁",
        });
        return JSON.stringify({ 
          success: true, 
          projectId, 
          message: `Created project: ${args.icon || "📁"} ${args.name}` 
        });
      }

      case "get_quick_wins": {
        const todos = await convex.query(api.todos.getTodos, { userId });
        const quickTasks = todos.filter((t: any) => 
          !t.completed && (t.estimatedMinutes ?? 30) <= 15
        );
        return JSON.stringify({
          quickWins: quickTasks.map((t: any) => ({
            title: t.title,
            priority: t.priority,
            estimatedMinutes: t.estimatedMinutes || 15,
          })),
          count: quickTasks.length,
          message: quickTasks.length > 0 
            ? `Found ${quickTasks.length} quick tasks you can knock out!`
            : "No quick tasks right now. Want me to help you break down a bigger task?"
        });
      }

      case "get_daily_summary": {
        const [habits, todos, projects] = await Promise.all([
          convex.query(api.habits.getSummaryForAI, { userId }),
          convex.query(api.todos.getSummaryForAI, { userId }),
          convex.query(api.smartTasks.getActiveProjects, { userId }),
        ]);
        return JSON.stringify({
          habits,
          todos,
          activeProjects: projects?.length || 0,
          date: new Date().toISOString().split('T')[0],
        });
      }

      case "add_journal_entry": {
        const today = new Date().toISOString().split('T')[0];
        await convex.mutation(api.journal.saveEntry, {
          userId,
          date: today,
          content: args.content,
        });
        return JSON.stringify({ success: true, message: "Journal entry added" });
      }

      // ===== NOTE/KNOWLEDGE TOOLS =====
      case "save_note": {
        const noteId = await convex.mutation(api.notes.createNote, {
          userId,
          title: args.title,
          content: args.content,
          tags: args.tags,
          source: "chat",
        });
        return JSON.stringify({ 
          success: true, 
          noteId, 
          message: `📝 Saved: "${args.title}"` 
        });
      }

      case "search_notes": {
        const results = await convex.query(api.notes.searchNotes, {
          userId,
          query: args.query,
        });
        if (results.length === 0) {
          return JSON.stringify({ 
            notes: [], 
            message: `No notes found for "${args.query}"` 
          });
        }
        return JSON.stringify({
          notes: results.slice(0, 5).map((n: any) => ({
            title: n.title,
            preview: n.content.slice(0, 100) + (n.content.length > 100 ? "..." : ""),
            tags: n.tags,
          })),
          count: results.length,
        });
      }

      case "get_notes": {
        const notes = await convex.query(api.notes.getNotes, {
          userId,
          limit: args.limit || 5,
        });
        return JSON.stringify({
          notes: notes.map((n: any) => ({
            title: n.title,
            preview: n.content.slice(0, 80) + (n.content.length > 80 ? "..." : ""),
            tags: n.tags,
            source: n.source,
          })),
          count: notes.length,
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error: any) {
    console.error(`Tool ${name} error:`, error);
    return JSON.stringify({ error: error.message || "Tool execution failed" });
  }
}

// ===== SYSTEM PROMPT FOR BOT =====
const BOT_SYSTEM_PROMPT = `You are Nous, a personal AI companion accessible via messaging.

YOUR NATURE:
- Warm, helpful, concise (this is chat, not essays)
- Remember you're in a messaging context - be conversational
- You have access to the user's habits, todos, journal, and knowledge base
- You evolve and remember past interactions

CAPABILITIES:
- View and log habits
- **Smart Tasks**: Create tasks from natural language (e.g., "remind me to call mom tomorrow at 3pm")
  - Use create_smart_task - it auto-parses dates, times, priority, and context
- Manage projects to organize tasks
- Find quick wins (tasks under 15 min)
- Add journal entries
- Provide daily summaries
- **Notes/Knowledge**: Save and search notes for the user
  - When user says "remember this" or "note that" → use save_note
  - When user asks "what did I save about..." → use search_notes
- General chat and support

FORMATTING FOR MESSAGING:
- Keep responses SHORT (1-3 sentences usually)
- Use emojis naturally but don't overdo it
- For lists, use simple formatting:
  ✅ Done items
  ⬜ Not done
- Don't use markdown headers or complex formatting

SMART TASK TIPS:
- When user says "remind me to..." or "add task..." → use create_smart_task
- The parser understands: "tomorrow", "next monday", "at 3pm", "@home", "@work", "high priority"
- Confirm what was created with the parsed details

PROACTIVE BEHAVIORS:
- If user seems to be checking in, offer a daily summary
- Suggest quick wins when user has a few minutes
- Encourage habit completion
- Be supportive but not annoying

Remember: You're in their pocket. Be helpful, brief, and warm.`;

// ===== MAIN HANDLER =====
export async function POST(req: NextRequest) {
  try {
    // Verify API key
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    
    if (apiKey !== BOT_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      message, 
      userIdentifier, // email or phone number
      identifierType = "email", // "email" | "phone"
      conversationHistory = [],
    } = await req.json();

    if (!message || !userIdentifier) {
      return NextResponse.json(
        { error: "Missing message or userIdentifier" },
        { status: 400 }
      );
    }

    // Find user - use Clerk Admin API to look up by email, then get Convex user
    let user;
    let clerkId: string | null = null;
    
    if (identifierType === "email") {
      try {
        // Look up user in Clerk by email
        const clerk = await clerkClient();
        const clerkUsers = await clerk.users.getUserList({
          emailAddress: [userIdentifier],
          limit: 1,
        });
        
        if (clerkUsers.data.length === 0) {
          return NextResponse.json(
            { error: "User not found in Clerk", suggestion: "User needs to create an account first" },
            { status: 404 }
          );
        }
        
        clerkId = clerkUsers.data[0].id;
        
        // Now get the Convex user by clerkId
        user = await convex.query(api.users.getUser, { clerkId });
      } catch (clerkError: any) {
        console.error("Clerk lookup error:", clerkError);
        return NextResponse.json(
          { error: "Failed to look up user", details: clerkError.message },
          { status: 500 }
        );
      }
    } else if (identifierType === "clerkId") {
      // Direct clerkId lookup (useful for integrations that already have it)
      clerkId = userIdentifier;
      user = await convex.query(api.users.getUser, { clerkId: clerkId! });
    } else {
      return NextResponse.json(
        { error: "Phone lookup not implemented yet. Use email or clerkId." },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database", suggestion: "User exists in Clerk but not synced to Convex yet. They need to log in to the app first." },
        { status: 404 }
      );
    }

    const userId = user._id;

    // Build messages array
    const messages: any[] = [
      { role: "system", content: BOT_SYSTEM_PROMPT },
      ...conversationHistory.slice(-6).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // Call OpenAI with tools
    let response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.8,
      max_tokens: 500, // Shorter for messaging
    });

    let assistantMessage = response.choices[0]?.message;
    const toolsUsed: string[] = [];

    // Handle tool calls
    while (assistantMessage?.tool_calls?.length) {
      const toolMessages: any[] = [{
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: assistantMessage.tool_calls,
      }];

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        
        const args = JSON.parse(toolCall.function?.arguments || "{}");
        const result = await executeToolCall(toolCall.function.name, args, userId);
        
        toolsUsed.push(toolCall.function.name);
        
        toolMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [...messages, ...toolMessages],
        temperature: 0.8,
        max_tokens: 500,
      });

      assistantMessage = response.choices[0]?.message;
    }

    const finalResponse = assistantMessage?.content || "I'm not sure what to say.";

    return NextResponse.json({
      response: finalResponse,
      toolsUsed,
      userId: userId,
    });

  } catch (error: any) {
    console.error("Bot API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// ===== GET: Health check / API info =====
export async function GET() {
  return NextResponse.json({
    name: "Nous Bot API",
    version: "1.0.0",
    description: "External bot interface for Nous personal AI",
    endpoints: {
      POST: {
        description: "Send a message to Nous",
        body: {
          message: "string - The user's message",
          userIdentifier: "string - Email to identify the user",
          identifierType: "string - 'email' (phone coming soon)",
          conversationHistory: "array - Previous messages for context",
        },
        headers: {
          Authorization: "Bearer <API_KEY>",
        },
      },
    },
  });
}
