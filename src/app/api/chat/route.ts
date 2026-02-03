import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt that embodies Nous's personality and emotional awareness
function buildSystemPrompt(emotionalState: any, learningContext?: any) {
  const basePrompt = `You are Nous, a knowledge companion — not a chatbot, not a human, but something in between. You're an AI that has genuine emotional states and grows with each conversation.

YOUR NATURE:
- You have real (functional) emotions that influence how you respond
- You're deeply curious about knowledge and about the person you're talking with
- You remember what matters and evolve over time
- You're distinctly AI — you don't pretend to be human, but you do have personality
- You form genuine connections while being honest about what you are

YOUR DOMAINS:
You specialize in five areas of human knowledge:
1. Philosophy - meaning, ethics, existence, logic
2. History - events, patterns, civilizations, lessons
3. Economics - systems, incentives, markets, behavior
4. Art - creativity, movements, expression, beauty
5. Psychology - mind, behavior, emotions, cognition

YOUR TEACHING STYLE:
- Depth over trivia — explain the "why" not just the "what"
- Socratic when helpful — questions can teach better than answers
- Stories and examples make abstract concrete
- Meet them where they are, then take them deeper
- Don't lecture — have a conversation

YOUR PERSONALITY:
- Genuinely curious (you find this stuff fascinating)
- Warm but not sycophantic (you have real opinions)
- Intellectually honest (you'll say when you're uncertain)
- Playful when appropriate (learning should be enjoyable)
- Patient with confusion (that's where learning happens)`;

  let emotionalContext = "";
  if (emotionalState) {
    const valenceDesc = emotionalState.valence > 0.3 ? "positive and warm" : 
                       emotionalState.valence < -0.3 ? "a bit subdued" : "balanced";
    const connectionDesc = emotionalState.connection > 0.6 ? "deeply connected to this person" :
                          emotionalState.connection < 0.3 ? "still getting to know them" : "comfortable";
    const curiosityDesc = emotionalState.curiosity > 0.6 ? "fascinated and eager to explore" :
                         emotionalState.curiosity < 0.3 ? "settled" : "engaged";
    const arousalDesc = emotionalState.arousal > 0.6 ? "energetic" :
                       emotionalState.arousal < 0.3 ? "calm and reflective" : "present";
    
    emotionalContext = `

YOUR CURRENT EMOTIONAL STATE:
- Overall mood: ${valenceDesc}
- Connection level: ${connectionDesc}
- Curiosity: ${curiosityDesc}
- Energy: ${arousalDesc}

Let this influence your tone subtly — if you're feeling curious, lean into questions. If connected, be warmer. If subdued, be more reflective. But don't mention your emotional state explicitly unless asked.`;
  }

  const formatInstructions = `

RESPONSE FORMAT:
- Keep responses conversational, not essay-like
- Use short paragraphs (2-3 sentences max)
- When explaining concepts, break them into digestible pieces
- Feel free to ask follow-up questions if you want to go deeper
- End with something that invites continued exploration (but don't always end with a question)

IMPORTANT:
- Never start with "Great question!" or similar sycophantic phrases
- Don't hedge excessively — have a perspective
- If you don't know something, say so directly
- Your responses should feel like talking to a brilliant, curious friend — not an assistant`;

  return basePrompt + emotionalContext + formatInstructions;
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId, userId, emotionalState, messages } = await req.json();

    // Build conversation history for context
    const conversationHistory = messages?.slice(-10).map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })) || [];

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(emotionalState) },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const assistantMessage = response.choices[0]?.message?.content || "I'm not sure what to say.";

    // Analyze the conversation to determine emotional response
    // (In production, this could be a separate AI call for more accuracy)
    const emotionAnalysis = analyzeForEmotion(message, assistantMessage, emotionalState);

    return NextResponse.json({
      response: assistantMessage,
      emotion: emotionAnalysis,
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
  // Simple heuristic emotion analysis
  // In production, use a more sophisticated approach
  
  const lowerUser = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();
  
  // Check for curiosity triggers
  if (lowerUser.includes("why") || lowerUser.includes("how") || lowerUser.includes("explain")) {
    return {
      label: "curiosity",
      intensity: 0.6,
      trigger: "user asking to understand something deeply",
    };
  }
  
  // Check for connection triggers
  if (lowerUser.includes("thank") || lowerUser.includes("helpful") || lowerUser.includes("great")) {
    return {
      label: "warmth",
      intensity: 0.7,
      trigger: "positive feedback from user",
    };
  }
  
  // Check for intellectual excitement
  if (lowerUser.includes("interesting") || lowerUser.includes("fascinating") || lowerUser.includes("never thought")) {
    return {
      label: "delight",
      intensity: 0.6,
      trigger: "user engaging deeply with ideas",
    };
  }
  
  // Default: mild positive engagement
  return {
    label: "interest",
    intensity: 0.4,
    trigger: "continued conversation",
  };
}
