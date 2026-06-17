/**
 * LLM entry point for the AI commerce module.
 * Provider is selected via feature-flags.config.json → ai.llmProvider (openai | gemini | llama).
 */
import OpenAI from "openai";
import {
  completeChat,
  getActiveLlmModel,
  isActiveLlmConfigured,
} from "./ai/providers";
import { getLlmProviderId } from "./ai/llmConfig";

export { completeChat, getLlmProviderId };
export type { LlmCompletionRequest, LlmChatMessage } from "./ai/providers";

export function isAiConfigured(): boolean {
  return isActiveLlmConfigured();
}

export function getLlmModel(): string {
  return getActiveLlmModel();
}

/** @deprecated Use completeChat() — kept for any legacy direct SDK usage */
export function getOpenAiModel(): string {
  return getLlmModel();
}

/** @deprecated Prefer completeChat(); only valid when ai.llmProvider is openai */
export function getOpenAiClient(): OpenAI {
  if (getLlmProviderId() !== "openai") {
    throw new Error(
      `getOpenAiClient() is only available when ai.llmProvider is "openai" (current: ${getLlmProviderId()}). Use completeChat() instead.`,
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}
