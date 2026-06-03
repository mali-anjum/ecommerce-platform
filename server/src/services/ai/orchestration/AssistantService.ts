import { getProductRecommendations } from "../recommendations/ProductRecommendationService";
import { parseRecommendationFilters } from "../classification/parsers/RecommendationParser";
import { buildRecommendationReply } from "../recommendations/RecommendationReply";
import { runLeadCaptureChat } from "../leads/LeadCaptureService";
import { runOrderSupportChat } from "../orders/OrderSupportService";
import { runGeneralChat } from "../chat/GeneralChatService";
import {
  classifyIntent,
  mapClassifiedIntentToLegacy,
} from "../classification/IntentClassifier";
import {
  handleOpenTicketMessage,
  incrementSessionFailureCount,
  resetSessionFailureCount,
  runHumanHandoffChat,
  shouldEscalateToHuman,
} from "../handoff/HandoffService";
import { isAssistantFailureReply } from "../classification/parsers/HandoffParser";
import {
  loadSessionHistory,
  mergeSessionHistory,
} from "../sessionMemory/SessionMemoryService";
import { isFeatureEnabled } from "../../../config/featureFlags";
import type { AssistantChatInput, AssistantChatResult } from "../types";

async function runDisabledSubFeatureReply(
  input: AssistantChatInput,
  history: AssistantChatInput["history"],
  featureLabel: string,
): Promise<AssistantChatResult> {
  const general = await runGeneralChat({
    message: input.message,
    productId: input.productId,
    history,
    classifiedIntent: "GENERAL_CHAT",
  });

  return {
    ...general,
    classifiedIntent: "GENERAL_CHAT",
    reply: `${featureLabel} is not available on this store right now. ${general.reply}`,
    sessionId: input.sessionId,
  };
}

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

export async function runAssistantChat(
  input: AssistantChatInput,
): Promise<AssistantChatResult> {
  const message = input.message.trim();
  const sessionHistory = await loadSessionHistory(input.sessionId);
  const history = mergeSessionHistory(sessionHistory, input.history ?? []);

  const openTicketResult = isFeatureEnabled("ai.humanHandoff")
    ? await handleOpenTicketMessage({
        message,
        userId: input.userId,
        sessionId: input.sessionId,
      })
    : null;
  if (openTicketResult) {
    return { ...openTicketResult, sessionId: input.sessionId };
  }

  const escalation = isFeatureEnabled("ai.humanHandoff")
    ? await shouldEscalateToHuman({
        message,
        sessionId: input.sessionId,
      })
    : { escalate: false as const };
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
      if (!isFeatureEnabled("ai.orderSupport")) {
        result = await runDisabledSubFeatureReply(
          input,
          history,
          "Order support",
        );
        break;
      }
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
      if (!isFeatureEnabled("ai.leadCapture")) {
        result = await runDisabledSubFeatureReply(
          input,
          history,
          "Lead capture",
        );
        break;
      }
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
      if (!isFeatureEnabled("ai.productRecommendations")) {
        result = await runDisabledSubFeatureReply(
          input,
          history,
          "Product recommendations",
        );
        break;
      }
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
