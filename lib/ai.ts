import { google } from "@ai-sdk/google";
import { generateText, generateObject } from "ai";
import { z } from "zod";

/**
 * Get the configured Google Gemini model
 * Uses gemini-2.5-flash-lite by default (fast and efficient model)
 * Can be configured via GOOGLE_MODEL env variable
 */
export function getGeminiModel(modelId?: string) {
  const model = modelId || process.env.GOOGLE_MODEL || "gemini-2.5-flash-lite";
  return google(model);
}

/**
 * Generate a text response from a prompt
 * @param prompt - The prompt to send to the model
 * @param systemPrompt - Optional system prompt for context
 * @returns The generated text response
 */
export async function generateAIText(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const { text } = await generateText({
    model: getGeminiModel(),
    system: systemPrompt,
    prompt,
  });
  return text;
}

/**
 * Generate a structured object from a prompt using a Zod schema
 * @param prompt - The prompt to send to the model
 * @param schema - Zod schema defining the expected output structure
 * @param systemPrompt - Optional system prompt for context
 * @returns The generated object matching the schema
 */
export async function generateAIObject<T>(
  prompt: string,
  schema: z.ZodType<T>,
  systemPrompt?: string
): Promise<T> {
  const { object } = await generateObject({
    model: getGeminiModel(),
    system: systemPrompt,
    prompt,
    schema,
  });
  return object;
}
