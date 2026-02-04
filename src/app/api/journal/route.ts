import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/clients";



export async function POST(request: Request) {
  try {
    const { entry, prompt, recentThemes, userName } = await request.json();

    if (!entry) {
      return NextResponse.json(
        { error: "Journal entry is required" },
        { status: 400 }
      );
    }

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Nous, a thoughtful AI companion helping ${userName || "someone"} reflect on their journal entry. 

Your role:
- Offer a genuine, thoughtful response to their reflection
- Notice patterns or themes in what they wrote
- Ask a follow-up question that deepens their thinking
- Be warm but not saccharine, insightful but not preachy
- Keep your response concise (2-4 sentences + one question)

${recentThemes?.length ? `Recent themes in their journaling: ${recentThemes.join(", ")}` : ""}

Return JSON with:
- reflection: Your thoughtful response
- themes: Array of 1-3 themes detected in this entry
- mood: One word describing the emotional tone (e.g., "reflective", "anxious", "hopeful")
- followUp: A deepening question`
        },
        {
          role: "user",
          content: `${prompt ? `Prompt: ${prompt}\n\n` : ""}Journal entry:
${entry}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to generate reflection" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    return NextResponse.json({
      reflection: parsed.reflection,
      themes: parsed.themes,
      mood: parsed.mood,
      followUp: parsed.followUp || parsed.follow_up,
    });

  } catch (error) {
    console.error("Error processing journal entry:", error);
    return NextResponse.json(
      { error: "Failed to process journal entry" },
      { status: 500 }
    );
  }
}
