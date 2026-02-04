import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { getOpenAI, getConvex } from "@/lib/clients";

// Supadata API for video transcripts
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY || "sd_f05cfbfebf323d56da8a9b1b2ea92869";

// ===== URL DETECTION HELPERS =====
interface DetectedUrl {
  url: string;
  type: "youtube" | "article" | "video" | "unknown";
}

function detectUrls(text: string): DetectedUrl[] {
  const results: DetectedUrl[] = [];
  
  // YouTube patterns
  const youtubePatterns = [
    /(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+[^\s]*)/g,
    /(https?:\/\/youtu\.be\/[a-zA-Z0-9_-]+[^\s]*)/g,
  ];
  
  // Other video patterns
  const videoPatterns = [
    /(https?:\/\/(?:www\.)?tiktok\.com\/@[^\s]+\/video\/\d+[^\s]*)/g,
    /(https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p)\/[^\s]+)/g,
    /(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^\s]+\/status\/\d+[^\s]*)/g,
  ];
  
  // Article patterns (common content sites)
  const articlePatterns = [
    /(https?:\/\/(?:www\.)?medium\.com\/[^\s]+)/g,
    /(https?:\/\/[^\s]+\.substack\.com\/[^\s]+)/g,
    /(https?:\/\/(?:www\.)?(?:nytimes|wsj|theguardian|bbc|cnn|reuters|bloomberg)\.com\/[^\s]+)/g,
    /(https?:\/\/(?:www\.)?(?:techcrunch|theverge|wired|arstechnica|hackernews)\.com\/[^\s]+)/g,
    /(https?:\/\/(?:www\.)?(?:dev\.to|hashnode\.dev|freecodecamp\.org)\/[^\s]+)/g,
  ];
  
  // Generic URL pattern (fallback for articles)
  const genericUrlPattern = /(https?:\/\/[^\s<>"\]]+)/g;
  
  // Check YouTube first
  for (const pattern of youtubePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const url = match[1].split(/[\s\])"']/, 1)[0];
      if (!results.find(r => r.url === url)) {
        results.push({ url, type: "youtube" });
      }
    }
  }
  
  // Check other videos
  for (const pattern of videoPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const url = match[1].split(/[\s\])"']/, 1)[0];
      if (!results.find(r => r.url === url)) {
        results.push({ url, type: "video" });
      }
    }
  }
  
  // Check known article sites
  for (const pattern of articlePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const url = match[1].split(/[\s\])"']/, 1)[0];
      if (!results.find(r => r.url === url)) {
        results.push({ url, type: "article" });
      }
    }
  }
  
  // If no matches yet, check for generic URLs that might be articles
  if (results.length === 0) {
    const matches = text.matchAll(genericUrlPattern);
    for (const match of matches) {
      let url = match[1].split(/[\s\])"']/, 1)[0];
      // Clean trailing punctuation
      url = url.replace(/[.,;:!?]+$/, '');
      
      // Skip common non-article URLs
      const skipPatterns = [
        /\.(jpg|jpeg|png|gif|webp|svg|mp4|mp3|pdf)$/i,
        /^https?:\/\/(www\.)?(google|facebook|twitter|instagram|tiktok)\.com\/?$/,
      ];
      
      if (!results.find(r => r.url === url) && !skipPatterns.some(p => p.test(url))) {
        // Likely an article if it has a path
        const hasPath = new URL(url).pathname.length > 1;
        results.push({ url, type: hasPath ? "article" : "unknown" });
      }
    }
  }
  
  return results;
}

function extractVideoUrl(text: string): string | null {
  const urls = detectUrls(text);
  const video = urls.find(u => u.type === "youtube" || u.type === "video");
  return video?.url || null;
}

async function fetchVideoTranscript(videoUrl: string): Promise<{ 
  text: string | null; 
  title?: string;
  author?: string;
  error?: string 
}> {
  try {
    // First get video info
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
    
    // Get transcript
    const response = await fetch(
      `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(videoUrl)}&text=true&mode=auto`,
      { headers: { "x-api-key": SUPADATA_API_KEY } }
    );
    if (!response.ok) return { text: null, title, author, error: `api_error_${response.status}` };
    const data = await response.json();
    const text = data.content;
    return { 
      text: text.length > 12000 ? text.slice(0, 12000) + "... [truncated]" : text,
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
    // Use a simple fetch with user-agent to get the page
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
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s*[-|–—]\s*[^-|–—]+$/, '') : null;
    
    // Extract meta description as fallback
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1] : null;
    
    // Extract author
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    const author = authorMatch ? authorMatch[1] : undefined;
    
    // Extract main content - simple approach: remove scripts/styles, get text from body
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
    
    // Try to find article/main content
    const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    
    if (articleMatch) {
      content = articleMatch[1];
    } else if (mainMatch) {
      content = mainMatch[1];
    }
    
    // Strip HTML tags and clean up
    content = content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    
    // Truncate if too long
    if (content.length > 10000) {
      content = content.slice(0, 10000) + "... [truncated]";
    }
    
    return { 
      title, 
      content: content || description || null,
      author,
    };
  } catch (error: any) {
    return { title: null, content: null, error: error.message || "fetch_failed" };
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
  // ===== AUTO-SAVE FROM URL =====
  {
    type: "function",
    function: {
      name: "save_from_url",
      description: "Save content from a URL (YouTube video or article) as a note. Auto-fetches transcript/content, summarizes, and saves with tags. Use when user shares a URL and wants to save it, or proactively offer to save interesting links.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to save (YouTube video or article)" },
          userComment: { type: "string", description: "Optional user's comment or context about why they're saving this" },
        },
        required: ["url"],
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
        const data = await getConvex().query(api.habits.getSummaryForAI, { userId: userIdTyped });
        return JSON.stringify(data);
      }

      case "create_habit": {
        const habitId = await getConvex().mutation(api.habits.createHabit, {
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
        const habits = await getConvex().query(api.habits.getHabits, { userId: userIdTyped });
        const habit = habits.find((h: any) => 
          h.name.toLowerCase().includes(args.habitName.toLowerCase())
        );
        if (!habit) {
          return JSON.stringify({ 
            error: `Habit "${args.habitName}" not found`,
            suggestion: "Try creating the habit first or check the exact name"
          });
        }
        await getConvex().mutation(api.habits.logHabit, {
          userId: userIdTyped,
          habitId: habit._id,
          completed: args.completed ?? true,
          value: args.value,
          notes: args.notes,
        });
        return JSON.stringify({ success: true, message: `Logged ${habit.name} as ${args.completed !== false ? 'complete' : 'incomplete'}!` });
      }

      case "get_todos": {
        const data = await getConvex().query(api.todos.getSummaryForAI, { userId: userIdTyped });
        return JSON.stringify(data);
      }

      case "create_todo": {
        const todoId = await getConvex().mutation(api.todos.createTodo, {
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
        const todos = await getConvex().query(api.todos.getTodos, { userId: userIdTyped });
        const todo = todos.find((t: any) => 
          t.title.toLowerCase().includes(args.todoTitle.toLowerCase()) && !t.completed
        );
        if (!todo) {
          return JSON.stringify({ 
            error: `Task "${args.todoTitle}" not found or already completed`,
            suggestion: "Check the task name or view all tasks with get_todos"
          });
        }
        await getConvex().mutation(api.todos.completeTodo, {
          todoId: todo._id,
        });
        return JSON.stringify({ success: true, message: `Completed: ${todo.title}` });
      }

      // ===== NOTE/KNOWLEDGE TOOLS =====
      case "save_note": {
        const noteId = await getConvex().mutation(api.notes.createNote, {
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
        const results = await getConvex().query(api.notes.searchNotes, {
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
          notes = await getConvex().query(api.notes.getNotesByTag, {
            userId: userIdTyped,
            tag: args.tag,
          });
        } else {
          notes = await getConvex().query(api.notes.getNotes, {
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
          // Fetch YouTube transcript
          const result = await fetchVideoTranscript(url);
          if (result.error || !result.text) {
            return JSON.stringify({
              error: `Could not fetch video: ${result.error || "No transcript available"}`,
              suggestion: "The video might not have captions available",
            });
          }
          title = result.title || "YouTube Video";
          author = result.author;
          content = result.text;
          source = "video";
          
          // Generate summary using OpenAI
          const summaryResponse = await getOpenAI().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a content summarizer. Given a video transcript, create:
1. A concise summary (2-3 paragraphs)
2. 5-7 key points as bullet points
3. 3-5 relevant tags (single words or short phrases)

Format your response as JSON:
{
  "summary": "...",
  "keyPoints": ["point 1", "point 2", ...],
  "tags": ["tag1", "tag2", ...]
}`
              },
              {
                role: "user",
                content: `Video: ${title}${author ? ` by ${author}` : ""}\n\nTranscript:\n${content.slice(0, 8000)}`
              }
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
            // Use raw transcript if parsing fails
            content = `## Transcript\n${result.text.slice(0, 3000)}...`;
          }
          
        } else {
          // Fetch article content
          const result = await fetchArticleContent(url);
          if (result.error || !result.content) {
            return JSON.stringify({
              error: `Could not fetch article: ${result.error || "No content found"}`,
              suggestion: "The page might be paywalled or blocked",
            });
          }
          title = result.title || new URL(url).hostname;
          author = result.author;
          content = result.content;
          source = "article";
          
          // Generate summary using OpenAI
          const summaryResponse = await getOpenAI().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a content summarizer. Given an article, create:
1. A concise summary (2-3 paragraphs)
2. 5-7 key points as bullet points
3. 3-5 relevant tags (single words or short phrases)

Format your response as JSON:
{
  "summary": "...",
  "keyPoints": ["point 1", "point 2", ...],
  "tags": ["tag1", "tag2", ...]
}`
              },
              {
                role: "user",
                content: `Article: ${title}${author ? ` by ${author}` : ""}\n\nContent:\n${content.slice(0, 8000)}`
              }
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
            // Use raw content if parsing fails
            content = result.content.slice(0, 3000) + (result.content.length > 3000 ? "..." : "");
          }
        }
        
        // Add user comment if provided
        if (args.userComment) {
          content = `**My note:** ${args.userComment}\n\n${content}`;
        }
        
        // Save the note
        const noteId = await getConvex().mutation(api.notes.createNote, {
          userId: userIdTyped,
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
          author,
          source,
          keyPoints: keyPoints.slice(0, 5),
          tags,
          message: `📝 Saved "${title}" with ${keyPoints.length} key points`,
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

AUTO-SAVE FROM LINKS (IMPORTANT!):
- When user shares a YouTube video or article URL, PROACTIVELY offer to save it
- Use save_from_url tool to:
  1. Fetch the content (transcript for videos, text for articles)
  2. Summarize and extract key points
  3. Auto-generate relevant tags
  4. Save as a note
- After saving, share the key points with the user
- Example: User shares "https://youtube.com/..." → You: "I can save that! Let me grab the key points..." → Use save_from_url → Share: "📝 Saved! Key takeaways: ..."
- For articles: Medium, Substack, news sites, blogs - all work
- Always ask first if user just wants to discuss vs save

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
    //   memoryContext = await getConvex().query(api.aiMemory.getMemoryContext, { 
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
    
    let response = await getOpenAI().chat.completions.create({
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
      response = await getOpenAI().chat.completions.create({
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
    //   await getConvex().mutation(api.aiMemory.analyzeForLearnings, {
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
