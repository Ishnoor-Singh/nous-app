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

// Supadata API for video transcripts
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY || "sd_f05cfbfebf323d56da8a9b1b2ea92869";

// ===== URL DETECTION HELPERS =====
interface DetectedUrl {
  url: string;
  type: "youtube" | "article" | "video" | "unknown";
}

function detectUrls(text: string): DetectedUrl[] {
  const results: DetectedUrl[] = [];
  
  const youtubePatterns = [
    /(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+[^\s]*)/g,
    /(https?:\/\/youtu\.be\/[a-zA-Z0-9_-]+[^\s]*)/g,
  ];
  
  const articlePatterns = [
    /(https?:\/\/(?:www\.)?medium\.com\/[^\s]+)/g,
    /(https?:\/\/[^\s]+\.substack\.com\/[^\s]+)/g,
  ];
  
  const genericUrlPattern = /(https?:\/\/[^\s<>"\]]+)/g;
  
  for (const pattern of youtubePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const url = match[1].split(/[\s\])"']/, 1)[0];
      if (!results.find(r => r.url === url)) {
        results.push({ url, type: "youtube" });
      }
    }
  }
  
  for (const pattern of articlePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const url = match[1].split(/[\s\])"']/, 1)[0];
      if (!results.find(r => r.url === url)) {
        results.push({ url, type: "article" });
      }
    }
  }
  
  if (results.length === 0) {
    const matches = text.matchAll(genericUrlPattern);
    for (const match of matches) {
      let url = match[1].split(/[\s\])"']/, 1)[0].replace(/[.,;:!?]+$/, '');
      if (!results.find(r => r.url === url)) {
        const hasPath = new URL(url).pathname.length > 1;
        results.push({ url, type: hasPath ? "article" : "unknown" });
      }
    }
  }
  
  return results;
}

async function fetchVideoTranscript(videoUrl: string): Promise<{ 
  text: string | null; 
  title?: string;
  author?: string;
  error?: string 
}> {
  try {
    const infoResponse = await fetch(
      `https://api.supadata.ai/v1/youtube/info?url=${encodeURIComponent(videoUrl)}`,
      { headers: { "x-api-key": SUPADATA_API_KEY } }
    );
    
    let title: string | undefined;
    let author: string | undefined;
    
    if (infoResponse.ok) {
      const info = await infoResponse.json();
      title = info.title;
      author = info.author || info.channel;
    }
    
    const response = await fetch(
      `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(videoUrl)}&text=true&mode=auto`,
      { headers: { "x-api-key": SUPADATA_API_KEY } }
    );
    if (!response.ok) return { text: null, title, author, error: `api_error_${response.status}` };
    const data = await response.json();
    const text = data.content;
    return { 
      text: text.length > 12000 ? text.slice(0, 12000) + "..." : text,
      title,
      author,
    };
  } catch (error) {
    return { text: null, error: "fetch_failed" };
  }
}

async function fetchArticleContent(url: string): Promise<{
  title: string | null;
  content: string | null;
  author?: string;
  error?: string;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NousBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      return { title: null, content: null, error: `fetch_error_${response.status}` };
    }
    
    const html = await response.text();
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s*[-|–—]\s*[^-|–—]+$/, '') : null;
    
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    const author = authorMatch ? authorMatch[1] : undefined;
    
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    
    const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    
    if (articleMatch) content = articleMatch[1];
    else if (mainMatch) content = mainMatch[1];
    
    content = content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();
    
    if (content.length > 10000) content = content.slice(0, 10000) + "...";
    
    return { title, content, author };
  } catch (error: any) {
    return { title: null, content: null, error: error.message || "fetch_failed" };
  }
}

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
  // ===== AUTO-SAVE FROM URL =====
  {
    type: "function" as const,
    function: {
      name: "save_from_url",
      description: "Save content from a URL (YouTube video or article) as a note. Auto-fetches transcript/content, summarizes, and saves. Use when user shares a link and wants to save it.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to save" },
          userComment: { type: "string", description: "Optional user's comment" },
        },
        required: ["url"],
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

      // ===== AUTO-SAVE FROM URL =====
      case "save_from_url": {
        const url = args.url;
        const detected = detectUrls(url);
        const urlInfo = detected[0] || { url, type: "article" as const };
        
        let title: string | null = null;
        let content: string | null = null;
        let author: string | undefined;
        let source: "video" | "article" = "article";
        let keyPoints: string[] = [];
        let tags: string[] = [];
        
        if (urlInfo.type === "youtube") {
          const result = await fetchVideoTranscript(url);
          if (result.error || !result.text) {
            return JSON.stringify({
              error: `Could not fetch video: ${result.error || "No transcript"}`,
            });
          }
          title = result.title || "YouTube Video";
          author = result.author;
          content = result.text;
          source = "video";
          
          const summaryResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `Summarize this video transcript. Return JSON: {"summary": "...", "keyPoints": ["...", ...], "tags": ["...", ...]}`
              },
              { role: "user", content: `${title}\n\n${content.slice(0, 6000)}` }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
          });
          
          try {
            const parsed = JSON.parse(summaryResponse.choices[0]?.message?.content || "{}");
            content = `## Summary\n${parsed.summary}\n\n## Key Points\n${(parsed.keyPoints || []).map((p: string) => `• ${p}`).join('\n')}`;
            keyPoints = parsed.keyPoints || [];
            tags = parsed.tags || [];
          } catch {
            content = result.text.slice(0, 2000);
          }
        } else {
          const result = await fetchArticleContent(url);
          if (result.error || !result.content) {
            return JSON.stringify({ error: `Could not fetch article: ${result.error}` });
          }
          title = result.title || new URL(url).hostname;
          author = result.author;
          content = result.content;
          source = "article";
          
          const summaryResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `Summarize this article. Return JSON: {"summary": "...", "keyPoints": ["...", ...], "tags": ["...", ...]}`
              },
              { role: "user", content: `${title}\n\n${content.slice(0, 6000)}` }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
          });
          
          try {
            const parsed = JSON.parse(summaryResponse.choices[0]?.message?.content || "{}");
            content = `## Summary\n${parsed.summary}\n\n## Key Points\n${(parsed.keyPoints || []).map((p: string) => `• ${p}`).join('\n')}`;
            keyPoints = parsed.keyPoints || [];
            tags = parsed.tags || [];
          } catch {
            content = result.content.slice(0, 2000);
          }
        }
        
        if (args.userComment) {
          content = `**My note:** ${args.userComment}\n\n${content}`;
        }
        
        const noteId = await convex.mutation(api.notes.createNote, {
          userId,
          title: title || "Saved Link",
          content,
          tags: tags.length > 0 ? tags : undefined,
          source,
          sourceUrl: url,
        });
        
        return JSON.stringify({
          success: true,
          noteId,
          title,
          keyPoints: keyPoints.slice(0, 4),
          tags,
          message: `📝 Saved: ${title}`,
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
- **Auto-Save Links**: When user shares a YouTube video or article URL:
  - Use save_from_url to fetch content, summarize, and save as a note
  - Share the key points after saving
  - Works with YouTube, Medium, Substack, news sites, blogs
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
