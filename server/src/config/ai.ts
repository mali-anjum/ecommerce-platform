import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o-mini";

let openaiClient: OpenAI | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

export function getOpenAiClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to server env to enable the shopping assistant.",
    );
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}
