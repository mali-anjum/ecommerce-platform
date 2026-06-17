import { getLlmProviderId } from "../llmConfig";
import { geminiProvider } from "./geminiProvider";
import { llamaProvider } from "./llamaProvider";
import { openaiProvider } from "./openaiProvider";
import type {
  LlmCompletionRequest,
  LlmProvider,
  LlmProviderId,
} from "./types";

const PROVIDERS: Record<LlmProviderId, LlmProvider> = {
  openai: openaiProvider,
  gemini: geminiProvider,
  llama: llamaProvider,
};

export function getActiveLlmProvider(): LlmProvider {
  const id = getLlmProviderId();
  return PROVIDERS[id];
}

export function isActiveLlmConfigured(): boolean {
  return getActiveLlmProvider().isConfigured();
}

export function getActiveLlmModel(): string {
  return getActiveLlmProvider().getModel();
}

export async function completeChat(
  request: LlmCompletionRequest,
): Promise<string> {
  return getActiveLlmProvider().completeChat(request);
}

export type { LlmCompletionRequest, LlmProviderId, LlmChatMessage } from "./types";
