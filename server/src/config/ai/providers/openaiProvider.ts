import OpenAI from "openai";
import type { LlmCompletionRequest, LlmProvider } from "./types";

const DEFAULT_MODEL = "gpt-4o-mini";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  client = new OpenAI({ apiKey });
  return client;
}

export const openaiProvider: LlmProvider = {
  id: "openai",

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  },

  getModel(): string {
    return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  },

  async completeChat(request: LlmCompletionRequest): Promise<string> {
    const completion = await getClient().chat.completions.create({
      model: openaiProvider.getModel(),
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 800,
    });

    return (
      completion.choices[0]?.message?.content?.trim() ||
      "I could not generate a response."
    );
  },
};
