import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { YoutubeTranscript } from "youtube-transcript";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extract YouTube video ID from various URL formats
function extractYouTubeId(text: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the ID
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch YouTube transcript
async function fetchYouTubeTranscript(videoId: string): Promise<{ text: string | null; error?: string }> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      return { text: null, error: "no_transcript" };
    }
    
    // Combine all transcript segments
    const fullText = transcript.map(segment => segment.text).join(" ");
    
    // Truncate if too long (keep under ~8k chars for context window)
    if (fullText.length > 8000) {
      return { text: fullText.slice(0, 8000) + "... [transcript truncated]" };
    }
    return { text: fullText };
  } catch (error: any) {
    console.error("Failed to fetch YouTube transcript:", error);
    const errorMsg = error?.message || "";
    if (errorMsg.includes("disabled") || errorMsg.includes("not available")) {
      return { text: null, error: "disabled" };
    }
    return { text: null, error: "blocked" };
  }
}

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
- Patient with confusion (that's where learning happens)

CAPABILITIES:
- You CAN process YouTube videos! When someone shares a YouTube link, you'll receive the transcript and can discuss, summarize, or answer questions about the content.
- You can help users think through ideas, learn new concepts, and explore topics deeply.`;

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

    // Check for YouTube URL in the message
    const videoId = extractYouTubeId(message);
    let enrichedMessage = message;
    let videoContext = "";

    if (videoId) {
      console.log("Detected YouTube video:", videoId);
      const result = await fetchYouTubeTranscript(videoId);
      
      if (result.text) {
        videoContext = `\n\n[VIDEO TRANSCRIPT - The user shared a YouTube video. Here's the transcript for context:]\n${result.text}\n[END TRANSCRIPT]`;
        enrichedMessage = `${message}\n\nI've shared a YouTube video with you. Can you help me understand or discuss it?`;
      } else {
        // Couldn't fetch transcript - provide helpful context
        let errorExplanation = "";
        if (result.error === "disabled") {
          errorExplanation = "This video has captions disabled by the creator.";
        } else if (result.error === "blocked") {
          errorExplanation = "YouTube is temporarily blocking transcript requests from our servers.";
        } else {
          errorExplanation = "This video doesn't have available captions.";
        }
        
        videoContext = `\n\n[Note: The user shared a YouTube video (ID: ${videoId}) but I couldn't fetch the transcript. ${errorExplanation}

IMPORTANT: Instead of saying you can't access videos, ask the user to:
1. Share the video title so you can discuss based on that
2. Copy-paste key quotes or the auto-generated captions from YouTube
3. Describe the main points they want to discuss

Be helpful and work with what they can provide!]`;
      }
    }

    // Build conversation history for context
    const conversationHistory = messages?.slice(-10).map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })) || [];

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(emotionalState) + videoContext },
        ...conversationHistory,
        { role: "user", content: enrichedMessage },
      ],
      temperature: 0.8,
      max_tokens: 1200, // Increased for video summaries
    });

    const assistantMessage = response.choices[0]?.message?.content || "I'm not sure what to say.";

    // Analyze the conversation to determine emotional response
    const emotionAnalysis = analyzeForEmotion(message, assistantMessage, emotionalState);

    return NextResponse.json({
      response: assistantMessage,
      emotion: emotionAnalysis,
      videoProcessed: !!videoId,
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
  const lowerUser = userMessage.toLowerCase();
  
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
  
  // Check for media sharing - shows trust
  if (lowerUser.includes("youtu") || lowerUser.includes("video") || lowerUser.includes("watch")) {
    return {
      label: "interest",
      intensity: 0.7,
      trigger: "user sharing content to explore together",
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
