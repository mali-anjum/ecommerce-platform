import OpenAI from "openai";
import type { LlmCompletionRequest, LlmProvider } from "./types";

const DEFAULT_MODEL = "llama3.2";
const DEFAULT_BASE_URL = "http://127.0.0.1:11434/v1";

let client: OpenAI | null = null;

function getBaseUrl(): string {
  const raw = process.env.LLAMA_BASE_URL?.trim() || DEFAULT_BASE_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function getClient(): OpenAI {
  if (client) return client;

  client = new OpenAI({
    apiKey: process.env.LLAMA_API_KEY?.trim() || "ollama",
    baseURL: getBaseUrl(),
  });
  return client;
}

export const llamaProvider: LlmProvider = {
  id: "llama",

  isConfigured(): boolean {
    return Boolean(getBaseUrl());
  },

  getModel(): string {
    return process.env.LLAMA_MODEL?.trim() || DEFAULT_MODEL;
  },

  async completeChat(request: LlmCompletionRequest): Promise<string> {
    const completion = await getClient().chat.completions.create({
      model: llamaProvider.getModel(),
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
