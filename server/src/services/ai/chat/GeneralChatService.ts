import { getOpenAiClient, getOpenAiModel, isAiConfigured } from "../../../config/ai";
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
      "Shopping assistant is not configured. Please try again later.",
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

  const client = getOpenAiClient();
  const completion = await client.chat.completions.create({
    model: getOpenAiModel(),
    messages,
    temperature: 0.3,
    max_tokens: 800,
  });

  const reply =
    completion.choices[0]?.message?.content?.trim() ||
    "I could not generate a response. Please try again.";

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
