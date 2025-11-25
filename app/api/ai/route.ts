import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

/**
 * POST /api/ai
 * 
 * Generate AI responses using Google Gemini
 * 
 * Request body:
 * {
 *   prompt: string;           // The prompt to send (include your data here)
 *   systemPrompt?: string;    // Optional system prompt for context
 *   model?: string;           // Model to use (default: gemini-2.5-flash-lite)
 * }
 * 
 * Response:
 * {
 *   text: string;             // The generated response
 *   usage?: object;           // Token usage information
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, systemPrompt, model: modelId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const modelName = modelId || process.env.GOOGLE_MODEL || "gemini-2.5-flash-lite";
    const model = google(modelName);

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt,
    });

    return NextResponse.json({
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    });
  } catch (error) {
    console.error("AI generation error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Google API key not configured. Set GOOGLE_GENERATIVE_AI_API_KEY environment variable." },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
