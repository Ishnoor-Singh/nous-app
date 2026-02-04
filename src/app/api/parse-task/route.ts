import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/clients";


/**
 * Natural Language Task Parser
 * 
 * Parses natural language input into structured task data.
 * Examples:
 * - "Call mom tomorrow at 3pm" → task with due date/time
 * - "Buy groceries @errands" → task with context
 * - "Finish report #work high priority" → task with project and priority
 * - "Water plants every monday" → recurring task
 */


// Get current date info for relative date parsing
function getDateContext() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  return {
    today: now.toISOString().split('T')[0],
    dayOfWeek: days[now.getDay()],
    dayNum: now.getDate(),
    month: months[now.getMonth()],
    year: now.getFullYear(),
    time: now.toTimeString().slice(0, 5),
  };
}

const PARSE_SYSTEM_PROMPT = `You are a task parser. Extract structured data from natural language task input.

Current date context:
{{DATE_CONTEXT}}

Return a JSON object with these fields:
{
  "type": "task" | "note" | "reminder" | "idea",
  "title": "Clean, actionable title",
  "dueDate": "YYYY-MM-DD or null",
  "dueTime": "HH:MM (24h) or null",
  "priority": "high" | "medium" | "low" | null,
  "context": "home" | "work" | "errands" | "phone" | "computer" | "anywhere" | null,
  "project": "project name if mentioned or null",
  "estimatedMinutes": number or null,
  "isRecurring": boolean,
  "recurrence": {
    "pattern": "daily" | "weekdays" | "weekly" | "biweekly" | "monthly" | null,
    "daysOfWeek": [0-6] for weekly (0=Sunday) or null,
    "dayOfMonth": 1-31 for monthly or null
  } | null,
  "confidence": 0.0-1.0
}

Rules:
- "tomorrow" = next day from today
- "next week" = 7 days from today
- "monday" = next Monday (or today if today is Monday)
- "@home", "@work", "@errands" = context
- "#project" or "for project" = project name
- "high priority", "urgent", "asap" = high priority
- "every day", "daily" = daily recurrence
- "every monday" = weekly on Monday
- "every month on the 15th" = monthly on 15th
- If no time specified but task implies urgency, don't invent a time
- estimatedMinutes: "quick" = 15, "30 min" = 30, "1 hour" = 60

ONLY return the JSON object, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const { input, userId } = await req.json();

    if (!input) {
      return NextResponse.json(
        { error: "Missing input text" },
        { status: 400 }
      );
    }

    const dateContext = getDateContext();
    const systemPrompt = PARSE_SYSTEM_PROMPT.replace(
      '{{DATE_CONTEXT}}',
      `Today is ${dateContext.dayOfWeek}, ${dateContext.month} ${dateContext.dayNum}, ${dateContext.year} (${dateContext.today}). Current time: ${dateContext.time}.`
    );

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      temperature: 0.3, // Low temp for consistent parsing
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "{}";
    
    // Parse the JSON response
    let parsed;
    try {
      // Handle potential markdown code blocks
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json(
        { 
          error: "Failed to parse task",
          raw: content,
        },
        { status: 500 }
      );
    }

    // Validate and clean the response
    const result = {
      type: parsed.type || "task",
      title: parsed.title || input,
      dueDate: parsed.dueDate || null,
      dueTime: parsed.dueTime || null,
      priority: ["high", "medium", "low"].includes(parsed.priority) ? parsed.priority : null,
      context: ["home", "work", "errands", "phone", "computer", "anywhere"].includes(parsed.context) ? parsed.context : null,
      project: parsed.project || null,
      estimatedMinutes: typeof parsed.estimatedMinutes === "number" ? parsed.estimatedMinutes : null,
      isRecurring: Boolean(parsed.isRecurring),
      recurrence: parsed.isRecurring ? parsed.recurrence : null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
      originalInput: input,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Parse task error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET: API info
export async function GET() {
  return NextResponse.json({
    name: "Natural Language Task Parser",
    version: "1.0.0",
    description: "Parse natural language into structured task data",
    examples: [
      "Call mom tomorrow at 3pm",
      "Buy groceries @errands",
      "Finish report #work high priority",
      "Water plants every monday",
      "Quick email to boss about meeting",
      "Read book for 30 min @home low priority",
    ],
  });
}
