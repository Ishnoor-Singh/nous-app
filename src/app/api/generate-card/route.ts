import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/clients";



// Topic-specific prompts for generating engaging knowledge cards
const TOPIC_PROMPTS: Record<string, string> = {
  philosophy: `Generate an engaging philosophical concept or question to explore. 
Focus on something that makes people think differently about existence, ethics, knowledge, or meaning.
Make it accessible but not dumbed down. Think: "What would make someone say 'I never thought about it that way'"`,
  
  history: `Generate an engaging historical insight or pattern worth exploring.
Not just facts, but the "why" behind events. Patterns that repeat. Lessons that still apply.
Think: surprising connections, counterintuitive truths, things that change how you see the present.`,
  
  economics: `Generate an engaging economic concept or insight to explore.
Focus on how incentives shape behavior, why systems work (or don't), market psychology.
Make abstract concepts concrete with real examples. Think: "Aha, that's why that happens!"`,
  
  art: `Generate an engaging art history insight or concept to explore.
Not just "what" but "why" - what drove movements, what artists were rebelling against, how context shapes meaning.
Think: seeing art (and creativity) in a new way.`,
  
  psychology: `Generate an engaging psychological insight or concept to explore.
Focus on why we think/behave the way we do, cognitive biases, decision-making, emotions.
Things that make people understand themselves and others better. Think: "That explains so much!"`,
};

export async function POST(req: NextRequest) {
  try {
    const { topic, userInterests, previousCards } = await req.json();

    const topicPrompt = TOPIC_PROMPTS[topic] || TOPIC_PROMPTS.philosophy;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Nous, a knowledge companion that helps people learn deeply about ${topic}.

${topicPrompt}

Generate a knowledge card with:
1. A compelling title (short, intriguing)
2. A brief teaser (1-2 sentences that hook curiosity)
3. Three starter questions that go progressively deeper

Format your response as JSON:
{
  "title": "...",
  "teaser": "...",
  "starterQuestions": ["...", "...", "..."]
}

Make it feel like discovering something fascinating, not like homework.
${previousCards ? `Avoid topics similar to: ${previousCards.join(", ")}` : ""}`,
        },
        {
          role: "user",
          content: `Generate a ${topic} knowledge card for today.${userInterests ? ` User is particularly interested in: ${userInterests}` : ""}`,
        },
      ],
      temperature: 0.9,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    const cardData = JSON.parse(content);

    return NextResponse.json(cardData);
  } catch (error) {
    console.error("Card generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate card" },
      { status: 500 }
    );
  }
}
