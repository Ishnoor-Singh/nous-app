import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/clients";

import { Supadata, SupadataError } from "@supadata/js";


const supadata = new Supadata({
  apiKey: process.env.SUPADATA_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { url, type, title, transcript: providedTranscript } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const mediaType = type || detectMediaType(url);
    let transcript = providedTranscript;
    let videoTitle = title;

    // If it's a video URL and no transcript provided, fetch it
    if (!transcript && isVideoUrl(url)) {
      try {
        const result = await supadata.transcript({
          url,
          text: true,
          mode: "auto",
        });

        // Handle async job
        if ("jobId" in result) {
          const maxAttempts = 30;
          let attempts = 0;
          
          while (attempts < maxAttempts) {
            const jobResult = await supadata.transcript.getJobStatus(result.jobId);
            
            if (jobResult.status === "completed" && jobResult.result) {
              transcript = jobResult.result.content;
              break;
            } else if (jobResult.status === "failed") {
              throw new Error(jobResult.error?.message || "Transcript generation failed");
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
          }
        } else {
          transcript = result.content;
        }

        // Try to get video metadata for title if YouTube
        if (!videoTitle && url.includes("youtube") || url.includes("youtu.be")) {
          try {
            const videoId = extractYouTubeId(url);
            if (videoId) {
              const video = await supadata.youtube.video({ id: videoId });
              videoTitle = video.title;
            }
          } catch {
            // Ignore metadata errors
          }
        }
      } catch (err) {
        if (err instanceof SupadataError) {
          return NextResponse.json(
            { error: `Transcript error: ${err.message}` },
            { status: 400 }
          );
        }
        throw err;
      }
    }

    // If we have transcript content, summarize it
    if (transcript) {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a knowledge curator. Given a transcript or article content, extract:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)  
3. Notable quotes or insights (2-3 quotes)
4. Suggested tags for categorization (3-5 tags)

Respond with valid JSON only, using these exact keys:
{
  "summary": "string",
  "keyPoints": ["string", ...],
  "quotes": ["string", ...],
  "tags": ["string", ...]
}

Be thorough but concise. Focus on actionable insights and key takeaways.`
          },
          {
            role: "user",
            content: `Title: ${videoTitle || "Unknown"}
Type: ${mediaType}
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
        success: true,
        title: videoTitle,
        type: mediaType,
        summary: parsed.summary,
        keyPoints: parsed.keyPoints || parsed.key_points,
        quotes: parsed.quotes,
        tags: parsed.tags,
        transcriptLength: transcript.length,
      });
    }

    // For URLs without transcript capability
    return NextResponse.json({
      success: false,
      message: "Could not extract content from this URL type",
      url,
      type: mediaType,
    });

  } catch (error) {
    console.error("Error processing media:", error);
    return NextResponse.json(
      { error: "Failed to process media" },
      { status: 500 }
    );
  }
}

function detectMediaType(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("twitter.com") || url.includes("x.com")) return "tweet";
  if (url.includes("spotify.com")) return "podcast";
  if (url.includes("medium.com") || url.includes("substack.com")) return "article";
  return "other";
}

function isVideoUrl(url: string): boolean {
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("tiktok.com") ||
    url.includes("instagram.com/reel") ||
    url.includes("instagram.com/p/") ||
    (url.includes("twitter.com") || url.includes("x.com")) && url.includes("/status/")
  );
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
