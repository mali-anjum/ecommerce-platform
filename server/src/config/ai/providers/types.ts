export type LlmProviderId = "openai" | "gemini" | "llama";

export type LlmChatRole = "system" | "user" | "assistant";

export type LlmChatMessage = {
  role: LlmChatRole;
  content: string;
};

export type LlmCompletionRequest = {
  messages: LlmChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type LlmProvider = {
  id: LlmProviderId;
  isConfigured: () => boolean;
  getModel: () => string;
  completeChat: (request: LlmCompletionRequest) => Promise<string>;
};