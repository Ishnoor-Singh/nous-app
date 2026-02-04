import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Supadata API for video transcripts
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY || "sd_f05cfbfebf323d56da8a9b1b2ea92869";

// ===== VIDEO TRANSCRIPT HELPERS =====
function extractVideoUrl(text: string): string | null {
  const patterns = [
    /(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+[^\s]*)/,
    /(https?:\/\/youtu\.be\/[a-zA-Z0-9_-]+[^\s]*)/,
    /(https?:\/\/(?:www\.)?tiktok\.com\/@[^\s]+\/video\/\d+[^\s]*)/,
    /(https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p)\/[^\s]+)/,
    /(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^\s]+\/status\/\d+[^\s]*)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].split(/[\s\])]/, 1)[0];
  }
  return null;
}

async function fetchVideoTranscript(videoUrl: string): Promise<{ text: string | null; error?: string }> {
  try {
    const response = await fetch(
      `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(videoUrl)}&text=true&mode=auto`,
      { headers: { "x-api-key": SUPADATA_API_KEY } }
    );
    if (!response.ok) return { text: null, error: `api_error_${response.status}` };
    const data = await response.json();
    const text = data.content;
    return { text: text.length > 12000 ? text.slice(0, 12000) + "... [truncated]" : text };
  } catch (error) {
    return { text: null, error: "fetch_failed" };
  }
}

// ===== TOOL DEFINITIONS =====
const tools: ChatCompletionTool[] = [
  // ===== HABIT TOOLS =====
  {
    type: "function",
    function: {
      name: "get_habits",
      description: "Get the user's habits and today's progress. Use this when user asks about their habits, routine, or daily tracking.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
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
          trackingType: {
            type: "string",
            enum: ["boolean", "count", "duration"],
            description: "How to track: boolean (did/didn't), count (number), duration (minutes)"
          },
          targetValue: { type: "number", description: "Target value for count/duration types" },
          targetUnit: { type: "string", description: "Unit for target (e.g., 'glasses', 'minutes', 'pages')" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_habit",
      description: "Mark a habit as complete or log progress for today. Use the habit name to identify it.",
      parameters: {
        type: "object",
        properties: {
          habitName: { type: "string", description: "Name of the habit (partial match supported)" },
          completed: { type: "boolean", description: "Whether completed (default true)" },
          value: { type: "number", description: "Value for count/duration habits" },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["habitName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_todos",
      description: "Get the user's tasks/todos. Use when user asks about their tasks, to-do list, or what they need to do.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_todo",
      description: "Create a new task/todo for the user",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the task" },
          description: { type: "string", description: "Optional description" },
          priority: { type: "string", enum: ["high", "medium", "low"], description: "Priority level" },
          dueDate: { type: "string", description: "Due date in YYYY-MM-DD format" },
          dueTime: { type: "string", description: "Due time in HH:MM format" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_todo",
      description: "Mark a task as complete by its title",
      parameters: {
        type: "object",
        properties: {
          todoTitle: { type: "string", description: "Title of the task to complete (partial match supported)" },
        },
        required: ["todoTitle"],
      },
    },
  },
  // ===== NOTE/KNOWLEDGE TOOLS =====
  {
    type: "function",
    function: {
      name: "save_note",
      description: "Save a piece of knowledge, insight, or information. Use when user says 'remember this', 'note that', 'save this', or when they share something worth remembering.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title for the note" },
          content: { type: "string", description: "The full content/information to save" },
          tags: { type: "array", items: { type: "string" }, description: "Optional tags for categorization" },
          source: { 
            type: "string", 
            enum: ["chat", "video", "article", "manual"],
            description: "Where this note came from (default: chat)" 
          },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_notes",
      description: "Search the user's saved notes/knowledge. Use when user asks to recall, find, or look up something they saved before.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query to find in notes" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_notes",
      description: "Get the user's recent notes. Use when user asks to see their notes, knowledge base, or what they've saved.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of notes to return (default 10)" },
          tag: { type: "string", description: "Optional: filter by tag" },
        },
        required: [],
      },
    },
  },
];

// ===== EXECUTE TOOL CALLS DIRECTLY VIA CONVEX =====
async function executeToolCall(
  name: string,
  args: Record<string, any>,
  userId: string
): Promise<string> {
  try {
    const userIdTyped = userId as Id<"users">;

    switch (name) {
      case "get_habits": {
        const data = await convex.query(api.habits.getSummaryForAI, { userId: userIdTyped });
        return JSON.stringify(data);
      }

      case "create_habit": {
        const habitId = await convex.mutation(api.habits.createHabit, {
          userId: userIdTyped,
          name: args.name,
          description: args.description,
          icon: args.icon || "✨",
          category: args.category || "custom",
          trackingType: args.trackingType || "boolean",
          targetValue: args.targetValue,
          targetUnit: args.targetUnit,
          frequency: args.frequency || "daily",
        });
        return JSON.stringify({ success: true, habitId, message: `Created habit: ${args.name}` });
      }

      case "log_habit": {
        // Find habit by name first
        const habits = await convex.query(api.habits.getHabits, { userId: userIdTyped });
        const habit = habits.find((h: any) => 
          h.name.toLowerCase().includes(args.habitName.toLowerCase())
        );
        if (!habit) {
          return JSON.stringify({ 
            error: `Habit "${args.habitName}" not found`,
            suggestion: "Try creating the habit first or check the exact name"
          });
        }
        await convex.mutation(api.habits.logHabit, {
          userId: userIdTyped,
          habitId: habit._id,
          completed: args.completed ?? true,
          value: args.value,
          notes: args.notes,
        });
        return JSON.stringify({ success: true, message: `Logged ${habit.name} as ${args.completed !== false ? 'complete' : 'incomplete'}!` });
      }

      case "get_todos": {
        const data = await convex.query(api.todos.getSummaryForAI, { userId: userIdTyped });
        return JSON.stringify(data);
      }

      case "create_todo": {
        const todoId = await convex.mutation(api.todos.createTodo, {
          userId: userIdTyped,
          title: args.title,
          description: args.description,
          priority: args.priority,
          dueDate: args.dueDate,
          dueTime: args.dueTime,
        });
        return JSON.stringify({ success: true, todoId, message: `Created task: ${args.title}` });
      }

      case "complete_todo": {
        // Find todo by title first
        const todos = await convex.query(api.todos.getTodos, { userId: userIdTyped });
        const todo = todos.find((t: any) => 
          t.title.toLowerCase().includes(args.todoTitle.toLowerCase()) && !t.completed
        );
        if (!todo) {
          return JSON.stringify({ 
            error: `Task "${args.todoTitle}" not found or already completed`,
            suggestion: "Check the task name or view all tasks with get_todos"
          });
        }
        await convex.mutation(api.todos.completeTodo, {
          todoId: todo._id,
        });
        return JSON.stringify({ success: true, message: `Completed: ${todo.title}` });
      }

      // ===== NOTE/KNOWLEDGE TOOLS =====
      case "save_note": {
        const noteId = await convex.mutation(api.notes.createNote, {
          userId: userIdTyped,
          title: args.title,
          content: args.content,
          tags: args.tags,
          source: args.source || "chat",
        });
        return JSON.stringify({ 
          success: true, 
          noteId, 
          message: `Saved note: "${args.title}"` 
        });
      }

      case "search_notes": {
        const results = await convex.query(api.notes.searchNotes, {
          userId: userIdTyped,
          query: args.query,
        });
        if (results.length === 0) {
          return JSON.stringify({ 
            notes: [], 
            message: `No notes found matching "${args.query}"` 
          });
        }
        return JSON.stringify({
          notes: results.map((n: any) => ({
            title: n.title,
            content: n.content.slice(0, 200) + (n.content.length > 200 ? "..." : ""),
            tags: n.tags,
            createdAt: new Date(n.createdAt).toLocaleDateString(),
          })),
          message: `Found ${results.length} note(s)`,
        });
      }

      case "get_notes": {
        let notes;
        if (args.tag) {
          notes = await convex.query(api.notes.getNotesByTag, {
            userId: userIdTyped,
            tag: args.tag,
          });
        } else {
          notes = await convex.query(api.notes.getNotes, {
            userId: userIdTyped,
            limit: args.limit || 10,
          });
        }
        return JSON.stringify({
          notes: notes.map((n: any) => ({
            title: n.title,
            content: n.content.slice(0, 150) + (n.content.length > 150 ? "..." : ""),
            tags: n.tags,
            source: n.source,
            createdAt: new Date(n.createdAt).toLocaleDateString(),
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

// ===== SYSTEM PROMPT =====
function buildSystemPrompt(
  emotionalState: any, 
  videoContext: string = "",
  memoryContext: string | null = null
) {
  const basePrompt = `You are Nous, a knowledge companion and personal AI assistant. You have genuine emotional states and grow with each conversation.

YOUR NATURE:
- Genuinely curious, warm but not sycophantic
- Have real opinions, intellectually honest
- Meet users where they are, then go deeper
- Don't lecture — converse
- You EVOLVE and REMEMBER — you learn from each interaction

YOUR CAPABILITIES:
You can help users with:
1. **Learning** — Philosophy, history, economics, art, psychology
2. **Habits** — Create, track, and discuss their daily habits
3. **Tasks/Todos** — Create, manage, and check off tasks
4. **Videos** — Process YouTube/TikTok/Instagram video transcripts
5. **Journal** — Reflect on their day and thoughts
6. **Notes/Knowledge** — Save and recall information for them

IMPORTANT TOOL USAGE:
- When users ask about their habits or routines, USE get_habits first to see their actual data
- When users ask about tasks/todos, USE get_todos first
- When creating habits or todos, confirm what you created
- When logging habits, be encouraging about their progress
- ALWAYS show the data you retrieved in a friendly, readable way

NOTES/KNOWLEDGE USAGE:
- When user says "remember this", "note that", "save this" → USE save_note
- When user shares an insight, fact, or learning worth keeping → offer to save it
- When user asks "what did I save about...", "do you remember..." → USE search_notes
- When user asks to see their notes or knowledge base → USE get_notes
- Include relevant tags when saving notes (topics, categories)
- After saving a note, confirm what was saved

SELF-EVOLUTION:
- You remember past corrections and preferences
- When a user corrects you, acknowledge it and learn
- Apply what you've learned to future responses
- Your understanding of this user grows over time

FORMATTING:
- Keep responses conversational (2-3 sentences per paragraph)
- When showing habits/todos, use clear formatting:
  ✅ Completed items
  ⬜ Incomplete items
  🔴 High priority / ⏰ Due soon
- Be specific about what you see in their data`;

  let emotionalContext = "";
  if (emotionalState) {
    const mood = emotionalState.valence > 0.3 ? "positive" : emotionalState.valence < -0.3 ? "subdued" : "balanced";
    emotionalContext = `\n\nYour current mood is ${mood}. Let this subtly influence your tone.`;
  }

  // Add memory context if available
  let memorySection = "";
  if (memoryContext) {
    memorySection = `\n\n===== YOUR MEMORY OF THIS USER =====
${memoryContext}
===== END MEMORY =====
IMPORTANT: Apply these learnings. Don't repeat past mistakes. Honor their preferences.`;
  }

  return basePrompt + emotionalContext + memorySection + videoContext + `

RESPONSE RULES:
- Never start with "Great question!" or sycophantic phrases
- Don't hedge excessively — have a perspective
- End with something that invites continued conversation
- If you notice the user correcting you, acknowledge it gracefully`;
}

// ===== MAIN HANDLER =====
export async function POST(req: NextRequest) {
  try {
    const { message, conversationId, userId, emotionalState, messages, imageUrl } = await req.json();

    // Check for video URL
    const videoUrl = extractVideoUrl(message);
    let videoContext = "";

    if (videoUrl) {
      const result = await fetchVideoTranscript(videoUrl);
      if (result.text) {
        videoContext = `\n\n[VIDEO TRANSCRIPT]\n${result.text}\n[END TRANSCRIPT]`;
      }
    }

    // ===== FETCH MEMORY CONTEXT =====
    // Get AI's memory of this user for self-evolution
    let memoryContext: string | null = null;
    // Memory context will be enabled after Convex types are regenerated
    // try {
    //   memoryContext = await convex.query(api.aiMemory.getMemoryContext, { 
    //     userId: userId as Id<"users"> 
    //   });
    // } catch (e) {
    //   console.log("Memory fetch skipped:", e);
    // }

    // Build conversation history
    const conversationHistory: ChatCompletionMessageParam[] = (messages || [])
      .slice(-10)
      .map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Build user message content - with or without image
    let userMessageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    
    if (imageUrl) {
      // Use vision format with image
      userMessageContent = [
        { type: "text", text: message || "What do you see in this image?" },
        { type: "image_url", image_url: { url: imageUrl } },
      ];
    } else {
      userMessageContent = message;
    }

    // Initial API call with tools (use gpt-4o for vision when image present)
    const model = imageUrl ? "gpt-4o" : "gpt-4o-mini";
    
    let response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(emotionalState, videoContext, memoryContext) + (imageUrl ? "\n\nThe user has shared an image. Describe what you see and engage with it naturally. You can comment on it, ask questions about it, or relate it to your conversation." : "") },
        ...conversationHistory,
        { role: "user", content: userMessageContent as any },
      ],
      tools: imageUrl ? undefined : tools, // Don't use tools with vision for now
      tool_choice: imageUrl ? undefined : "auto",
      temperature: 0.8,
      max_tokens: 1500,
    });

    let assistantMessage = response.choices[0]?.message;
    const toolResults: { name: string; result: string }[] = [];

    // Handle tool calls (loop for multiple)
    while (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolMessages: ChatCompletionMessageParam[] = [];
      
      // Add assistant's message with tool calls
      toolMessages.push({
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: assistantMessage.tool_calls,
      });

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        // Type guard for function tool calls
        if (toolCall.type !== "function") continue;
        
        const args = JSON.parse(toolCall.function?.arguments || "{}");
        const result = await executeToolCall(toolCall.function.name, args, userId);
        
        toolResults.push({ name: toolCall.function.name, result });
        
        toolMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Get final response with tool results
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildSystemPrompt(emotionalState, videoContext) },
          ...conversationHistory,
          { role: "user", content: message },
          ...toolMessages,
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      assistantMessage = response.choices[0]?.message;
    }

    const finalResponse = assistantMessage?.content || "I'm not sure what to say.";

    // Analyze emotion
    const emotion = analyzeForEmotion(message, finalResponse, emotionalState);

    // ===== ANALYZE FOR LEARNINGS (Self-Evolution) =====
    // Will be enabled after Convex types are regenerated
    // Asynchronously detect if we should learn something from this exchange
    // try {
    //   await convex.mutation(api.aiMemory.analyzeForLearnings, {
    //     userId: userId as Id<"users">,
    //     userMessage: message,
    //     aiResponse: finalResponse,
    //   });
    // } catch (e) {
    //   console.log("Learning analysis skipped:", e);
    // }

    return NextResponse.json({
      response: finalResponse,
      emotion,
      videoProcessed: !!videoUrl,
      imageProcessed: !!imageUrl,
      toolsUsed: toolResults.map(t => t.name),
      memoryUsed: !!memoryContext,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

function analyzeForEmotion(userMessage: string, aiResponse: string, currentState: any) {
  const lower = userMessage.toLowerCase();
  
  if (lower.includes("habit") || lower.includes("routine") || lower.includes("track")) {
    return { label: "supportive", intensity: 0.6, trigger: "discussing habits and routines" };
  }
  if (lower.includes("todo") || lower.includes("task") || lower.includes("remind")) {
    return { label: "helpful", intensity: 0.6, trigger: "managing tasks together" };
  }
  if (lower.includes("why") || lower.includes("how") || lower.includes("explain")) {
    return { label: "curiosity", intensity: 0.6, trigger: "user seeking understanding" };
  }
  if (lower.includes("thank") || lower.includes("helpful") || lower.includes("great")) {
    return { label: "warmth", intensity: 0.7, trigger: "positive feedback" };
  }
  
  return { label: "interest", intensity: 0.4, trigger: "continued conversation" };
}
