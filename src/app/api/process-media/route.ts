import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { url, type, title, transcript } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // If we have a transcript (from YouTube), summarize it
    if (transcript) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a knowledge curator. Given a transcript or article content, extract:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Notable quotes or insights
4. Suggested tags for categorization

Be thorough but concise. Focus on actionable insights and key takeaways.`
          },
          {
            role: "user",
            content: `Title: ${title || "Unknown"}
Type: ${type || "content"}
URL: ${url}

Content/Transcript:
${transcript.slice(0, 15000)}` // Limit to avoid token issues
          }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return NextResponse.json(
          { error: "Failed to generate summary" },
          { status: 500 }
        );
      }

      const parsed = JSON.parse(content);

      return NextResponse.json({
        summary: parsed.summary,
        keyPoints: parsed.keyPoints || parsed.key_points,
        quotes: parsed.quotes,
        tags: parsed.tags,
      });
    }

    // For URLs without transcript, we'd need to fetch the content
    // This would typically use a service like Readability or a custom scraper
    return NextResponse.json({
      message: "Processing queued. Transcript/content extraction coming soon.",
      url,
      type,
    });

  } catch (error) {
    console.error("Error processing media:", error);
    return NextResponse.json(
      { error: "Failed to process media" },
      { status: 500 }
    );
  }
}

// Helper to detect media type from URL
export function detectMediaType(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("twitter.com") || url.includes("x.com")) return "tweet";
  if (url.includes("spotify.com")) return "podcast";
  if (url.includes("medium.com") || url.includes("substack.com")) return "article";
  return "other";
}
