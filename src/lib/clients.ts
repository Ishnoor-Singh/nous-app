import OpenAI from "openai";
import { ConvexHttpClient } from "convex/browser";

// Lazy initialization to avoid build-time errors when env vars aren't available

let openaiClient: OpenAI | null = null;
export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

let convexClient: ConvexHttpClient | null = null;
export function getConvex(): ConvexHttpClient {
  if (!convexClient) {
    convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convexClient;
}
