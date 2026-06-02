import { getOpenAiClient, getOpenAiModel, isAiConfigured } from "../../config/ai";
import { ApiError } from "../../utils/ApiError";
import { loadAssistantKnowledgeContext } from "./contextLoader";
import {
  buildAssistantSystemPrompt,
  buildChatMessages,
} from "./promptBuilder";
import { runLeadCaptureChat } from "./leadCapture.service";
import { runOrderSupportChat } from "./orderSupport.service";
import { getProductRecommendations } from "./productRecommendations";
import { parseRecommendationFilters } from "./recommendationParser";
import { buildRecommendationReply } from "./recommendationReply";
import type { AssistantChatInput, AssistantChatResult } from "./types";
import {
  loadSessionHistory,
  mergeSessionHistory,
} from "./sessionMemory/sessionMemoryService";
import {
  classifyIntent,
  mapClassifiedIntentToLegacy,
  type ClassifiedIntent,
} from "./intentClassifier";
import {
  handleOpenTicketMessage,
  incrementSessionFailureCount,
  resetSessionFailureCount,
  runHumanHandoffChat,
  shouldEscalateToHuman,
} from "./handoff.service";
import { isAssistantFailureReply } from "./handoffParser";

async function runRecommendationChat(
  message: string,
): Promise<Omit<AssistantChatResult, "classifiedIntent" | "sessionId">> {
  const filters = parseRecommendationFilters(message);
  const recommendation = await getProductRecommendations(message, filters);
  const reply = buildRecommendationReply(
    recommendation.products,
    recommendation.filtersApplied,
  );

  return {
    intent: "product_recommendation",
    reply,
    products: recommendation.products,
    productIdsReferenced: recommendation.products.map((product) => product.id),
    orders: [],
  };
}

async function runGeneralChat(input: {
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

export async function runAssistantChat(
  input: AssistantChatInput,
): Promise<AssistantChatResult> {
  const message = input.message.trim();
  const sessionHistory = await loadSessionHistory(input.sessionId);
  const history = mergeSessionHistory(sessionHistory, input.history ?? []);

  const openTicketResult = await handleOpenTicketMessage({
    message,
    userId: input.userId,
    sessionId: input.sessionId,
  });
  if (openTicketResult) {
    return { ...openTicketResult, sessionId: input.sessionId };
  }

  const escalation = await shouldEscalateToHuman({
    message,
    sessionId: input.sessionId,
  });
  if (escalation.escalate && escalation.reason) {
    const handoff = await runHumanHandoffChat({
      message,
      userId: input.userId,
      sessionId: input.sessionId,
      reason: escalation.reason,
    });
    return { ...handoff, sessionId: input.sessionId };
  }

  const classification = classifyIntent({
    message,
    leadSession: input.leadSession,
  });

  let result: AssistantChatResult;

  switch (classification.intent) {
    case "ORDER_SUPPORT": {
      const orderResult = await runOrderSupportChat({
        message,
        userId: input.userId,
        userRole: input.userRole,
        orderId: input.orderId,
      });
      result = {
        intent: orderResult.intent,
        classifiedIntent: classification.intent,
        reply: orderResult.reply,
        products: [],
        productIdsReferenced: orderResult.orders.map((order) => order.id),
        orders: orderResult.orders,
        orderSupportIntent: orderResult.orderSupportIntent,
        requiresAuth: orderResult.requiresAuth,
        sessionId: input.sessionId,
      };
      break;
    }
    case "LEAD": {
      const leadResult = await runLeadCaptureChat({
        message,
        leadSession: input.leadSession,
      });
      if (!leadResult) {
        const general = await runGeneralChat({
          message,
          productId: input.productId,
          history,
          classifiedIntent: "GENERAL_CHAT",
        });
        result = {
          ...general,
          classifiedIntent: "GENERAL_CHAT",
          sessionId: input.sessionId,
        };
        break;
      }
      result = {
        ...leadResult,
        classifiedIntent: classification.intent,
        sessionId: input.sessionId,
      };
      break;
    }
    case "PRODUCT_SEARCH": {
      const recommendation = await runRecommendationChat(message);
      result = {
        ...recommendation,
        classifiedIntent: classification.intent,
        sessionId: input.sessionId,
      };
      break;
    }
    case "FAQ":
    case "GENERAL_CHAT": {
      const general = await runGeneralChat({
        message,
        productId: input.productId,
        history,
        classifiedIntent: classification.intent,
      });
      result = {
        ...general,
        intent: mapClassifiedIntentToLegacy(classification.intent),
        classifiedIntent: classification.intent,
        sessionId: input.sessionId,
      };
      break;
    }
    default: {
      const general = await runGeneralChat({
        message,
        productId: input.productId,
        history,
        classifiedIntent: "GENERAL_CHAT",
      });
      result = {
        ...general,
        classifiedIntent: "GENERAL_CHAT",
        sessionId: input.sessionId,
      };
    }
  }

  if (isAssistantFailureReply(result.reply)) {
    await incrementSessionFailureCount(input.sessionId);
  } else if (result.classifiedIntent !== "HUMAN_HANDOFF") {
    await resetSessionFailureCount(input.sessionId);
  }

  return result;
}
