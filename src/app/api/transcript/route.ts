import { NextResponse } from "next/server";
import { Supadata, SupadataError } from "@supadata/js";

const supadata = new Supadata({
  apiKey: process.env.SUPADATA_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Get transcript - supports YouTube, TikTok, Instagram, X (Twitter)
    const result = await supadata.transcript({
      url,
      text: true, // Return plain text instead of timestamped chunks
      mode: "auto", // 'native', 'auto', or 'generate'
    });

    // Check if we got a job ID (for large files) or direct transcript
    if ("jobId" in result) {
      // Poll for job completion (with timeout)
      const maxAttempts = 30;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        const jobResult = await supadata.transcript.getJobStatus(result.jobId);
        
        if (jobResult.status === "completed" && jobResult.result) {
          return NextResponse.json({
            success: true,
            content: jobResult.result.content,
            lang: jobResult.result.lang,
          });
        } else if (jobResult.status === "failed") {
          return NextResponse.json(
            { error: jobResult.error?.message || "Transcript generation failed" },
            { status: 500 }
          );
        }
        
        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      return NextResponse.json(
        { error: "Transcript job timed out" },
        { status: 504 }
      );
    }

    // Direct transcript result
    return NextResponse.json({
      success: true,
      content: result.content,
      lang: result.lang,
      availableLangs: result.availableLangs,
    });

  } catch (error) {
    console.error("Transcript error:", error);
    
    if (error instanceof SupadataError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.error,
          details: error.details,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get transcript" },
      { status: 500 }
    );
  }
}

// GET endpoint for YouTube video info
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Extract video ID from YouTube URL
    const videoId = extractYouTubeId(url);
    
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Get video metadata
    const video = await supadata.youtube.video({ id: videoId });

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        channel: video.channel,
        duration: video.duration,
        viewCount: video.viewCount,
        uploadDate: video.uploadDate,
        thumbnail: video.thumbnail,
        tags: video.tags,
      },
    });

  } catch (error) {
    console.error("Video info error:", error);
    
    if (error instanceof SupadataError) {
      return NextResponse.json(
        { error: error.message, code: error.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get video info" },
      { status: 500 }
    );
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
