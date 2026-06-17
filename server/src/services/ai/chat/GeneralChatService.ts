import { completeChat, getLlmProviderId, isAiConfigured } from "../../../config/ai";
import { ApiError } from "../../../utils/ApiError";
import { loadAssistantKnowledgeContext } from "../knowledge/KnowledgeContextLoader";
import {
  buildAssistantSystemPrompt,
  buildChatMessages,
} from "../knowledge/PromptBuilder";
import type {
  AssistantChatInput,
  AssistantChatResult,
  ClassifiedIntent,
} from "../types";

export async function runGeneralChat(input: {
  message: string;
  productId?: string;
  history: AssistantChatInput["history"];
  classifiedIntent: ClassifiedIntent;
}): Promise<Omit<AssistantChatResult, "classifiedIntent" | "sessionId">> {
  if (!isAiConfigured()) {
    throw new ApiError(
      503,
      `Shopping assistant LLM is not configured for provider "${getLlmProviderId()}". Add the matching API keys to server env.`,
    );
  }

  const context = await loadAssistantKnowledgeContext(
    input.message,
    input.productId,
  );

  const systemPrompt = buildAssistantSystemPrompt(context, {
    focus:
      input.classifiedIntent === "FAQ"
        ? "Answer using FAQs, store policies, and help content first."
        : undefined,
  });
  const messages = buildChatMessages(
    systemPrompt,
    input.message,
    input.history ?? [],
  );

  const reply = await completeChat({
    messages,
    temperature: 0.3,
    maxTokens: 800,
  });

  const productIdsReferenced = context.products
    .filter(
      (product) =>
        reply.includes(product.id) ||
        reply.toLowerCase().includes(product.name.toLowerCase()),
    )
    .map((product) => product.id);

  return {
    intent: "general",
    reply,
    products: [],
    productIdsReferenced,
    orders: [],
  };
}
