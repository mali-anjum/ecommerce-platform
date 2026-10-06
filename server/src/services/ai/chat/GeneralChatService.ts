import { completeChat, getLlmProviderId, isAiConfigured } from "../../../config/ai";
import { sentryTracker } from "../../../lib/monitoring";
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

// Matches isAssistantFailureReply, so repeated provider failures escalate to a human.
export const GENERAL_CHAT_FALLBACK_REPLY =
  "Sorry, I could not generate a response right now. Please try again later, or visit the Help Center to contact support.";

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
    input.classifiedIntent,
  );

  const systemPrompt = buildAssistantSystemPrompt(context, {
    intent: input.classifiedIntent,
  });
  const messages = buildChatMessages(
    systemPrompt,
    input.message,
    input.history ?? [],
  );

  let reply: string;
  try {
    reply = (
      await completeChat({
        messages,
        temperature: 0.3,
        maxTokens: 800,
      })
    ).trim();
  } catch (error) {
    // Provider outage, rate limit, or timeout: degrade gracefully instead of a raw 500.
    sentryTracker(error, {
      source: "ai.generalChat",
      extra: { provider: getLlmProviderId(), intent: input.classifiedIntent },
    });
    reply = "";
  }

  if (!reply) {
    return {
      intent: "general",
      reply: GENERAL_CHAT_FALLBACK_REPLY,
      products: [],
      productIdsReferenced: [],
      orders: [],
    };
  }

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
