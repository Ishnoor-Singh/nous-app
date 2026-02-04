import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/clients";

export async function POST(req: NextRequest) {
  try {
    const { userMessage, assistantResponse } = await req.json();

    if (!userMessage) {
      return NextResponse.json({ title: "New chat" });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Generate a short, descriptive title (3-6 words max) for a conversation. 
The title should capture the main topic or intent.
Return ONLY the title, no quotes, no punctuation at the end.
Examples:
- "Learning about stoicism" → Exploring Stoicism
- "Add a task to buy groceries" → Task: Buy Groceries  
- "What are my habits?" → Checking Habits
- "I'm feeling stressed about work" → Work Stress Chat
- "Tell me about the Roman Empire" → Roman Empire History`,
        },
        {
          role: "user",
          content: `User: "${userMessage.slice(0, 200)}"${assistantResponse ? `\nAssistant: "${assistantResponse.slice(0, 200)}"` : ""}`,
        },
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    const title = completion.choices[0]?.message?.content?.trim() || "New chat";
    
    return NextResponse.json({ title });
  } catch (error) {
    console.error("Title generation error:", error);
    return NextResponse.json({ title: "New chat" });
  }
}
