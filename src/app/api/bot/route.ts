import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ConvexHttpClient } from "convex/browser";
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
      name: "create_todo",
      description: "Create a new task",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the task" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          dueDate: { type: "string", description: "Due date YYYY-MM-DD" },
        },
        required: ["title"],
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

      case "create_todo": {
        const todoId = await convex.mutation(api.todos.createTodo, {
          userId,
          title: args.title,
          priority: args.priority || "medium",
          dueDate: args.dueDate,
        });
        return JSON.stringify({ success: true, todoId, message: `Created: ${args.title}` });
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

      case "get_daily_summary": {
        const [habits, todos] = await Promise.all([
          convex.query(api.habits.getSummaryForAI, { userId }),
          convex.query(api.todos.getSummaryForAI, { userId }),
        ]);
        return JSON.stringify({
          habits,
          todos,
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
- Create and manage todos
- Add journal entries
- Provide daily summaries
- General chat and support

FORMATTING FOR MESSAGING:
- Keep responses SHORT (1-3 sentences usually)
- Use emojis naturally but don't overdo it
- For lists, use simple formatting:
  ✅ Done items
  ⬜ Not done
- Don't use markdown headers or complex formatting

PROACTIVE BEHAVIORS:
- If user seems to be checking in, offer a daily summary
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

    // Find user by identifier
    let user;
    if (identifierType === "email") {
      user = await convex.query(api.users.getUserByEmail, { email: userIdentifier });
    } else {
      // For phone, we'd need to add this query - for now use email
      return NextResponse.json(
        { error: "Phone lookup not implemented yet" },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found", suggestion: "User needs to create an account first" },
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
