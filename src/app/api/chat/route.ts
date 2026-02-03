import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supadata API key for video transcripts
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY || "sd_f05cfbfebf323d56da8a9b1b2ea92869";

// Extract video URL from text (YouTube, TikTok, Instagram, X, Facebook)
function extractVideoUrl(text: string): string | null {
  const patterns = [
    // YouTube
    /(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+[^\s]*)/,
    /(https?:\/\/youtu\.be\/[a-zA-Z0-9_-]+[^\s]*)/,
    // TikTok
    /(https?:\/\/(?:www\.)?tiktok\.com\/@[^\s]+\/video\/\d+[^\s]*)/,
    // Instagram
    /(https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p)\/[^\s]+)/,
    // X/Twitter
    /(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^\s]+\/status\/\d+[^\s]*)/,
    // Facebook
    /(https?:\/\/(?:www\.)?facebook\.com\/[^\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].split(/[\s\])]/, 1)[0]; // Clean trailing chars
  }
  return null;
}

// Fetch transcript using Supadata API
async function fetchVideoTranscript(videoUrl: string): Promise<{ text: string | null; error?: string }> {
  try {
    const encodedUrl = encodeURIComponent(videoUrl);
    const response = await fetch(
      `https://api.supadata.ai/v1/transcript?url=${encodedUrl}&text=true&mode=auto`,
      {
        headers: { "x-api-key": SUPADATA_API_KEY },
      }
    );

    // Handle async job (long videos)
    if (response.status === 202) {
      const { jobId } = await response.json();
      // Poll for results (max 30 seconds in serverless)
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const jobResponse = await fetch(`https://api.supadata.ai/v1/job/${jobId}`, {
          headers: { "x-api-key": SUPADATA_API_KEY },
        });
        const jobData = await jobResponse.json();
        if (jobData.status === "completed") {
          const text = jobData.content;
          return { text: text.length > 12000 ? text.slice(0, 12000) + "... [truncated]" : text };
        }
        if (jobData.status === "failed") {
          return { text: null, error: "transcription_failed" };
        }
      }
      return { text: null, error: "timeout" };
    }

    if (response.status === 206) {
      return { text: null, error: "no_transcript" };
    }

    if (!response.ok) {
      return { text: null, error: `api_error_${response.status}` };
    }

    const data = await response.json();
    const text = data.content;
    
    // Truncate if too long
    if (text.length > 12000) {
      return { text: text.slice(0, 12000) + "... [transcript truncated]" };
    }
    return { text };
  } catch (error: any) {
    console.error("Failed to fetch video transcript:", error);
    return { text: null, error: "fetch_failed" };
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

    // Check for video URL in the message (YouTube, TikTok, Instagram, X, Facebook)
    const videoUrl = extractVideoUrl(message);
    let enrichedMessage = message;
    let videoContext = "";

    if (videoUrl) {
      console.log("Detected video URL:", videoUrl);
      const result = await fetchVideoTranscript(videoUrl);
      
      if (result.text) {
        const platform = videoUrl.includes("youtube") || videoUrl.includes("youtu.be") ? "YouTube" :
                        videoUrl.includes("tiktok") ? "TikTok" :
                        videoUrl.includes("instagram") ? "Instagram" :
                        videoUrl.includes("twitter") || videoUrl.includes("x.com") ? "X (Twitter)" :
                        videoUrl.includes("facebook") ? "Facebook" : "video";
        
        videoContext = `\n\n[VIDEO TRANSCRIPT - The user shared a ${platform} video. Here's the transcript for context:]\n${result.text}\n[END TRANSCRIPT]`;
        enrichedMessage = `${message}\n\nI've shared a video with you. Can you help me understand or discuss it?`;
      } else {
        // Couldn't fetch transcript - provide helpful context
        let errorExplanation = "";
        if (result.error === "no_transcript") {
          errorExplanation = "This video doesn't have available captions.";
        } else if (result.error === "timeout") {
          errorExplanation = "The video is very long and transcription timed out.";
        } else {
          errorExplanation = "Couldn't access the video transcript.";
        }
        
        videoContext = `\n\n[Note: The user shared a video but I couldn't fetch the transcript. ${errorExplanation}

IMPORTANT: Instead of saying you can't access videos, ask the user to:
1. Share the video title so you can discuss based on that
2. Copy-paste key quotes or the auto-generated captions
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
      videoProcessed: !!videoUrl,
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
