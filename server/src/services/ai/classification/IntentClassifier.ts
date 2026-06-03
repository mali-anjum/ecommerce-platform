import { isLeadCaptureTrigger } from "./parsers/LeadCaptureParser";
import { isOrderSupportQuery } from "./parsers/OrderSupportParser";
import { isProductRecommendationQuery } from "./parsers/RecommendationParser";
import type { ClassifiedIntent, LeadSession } from "../types";

export type { ClassifiedIntent };

export type IntentClassification = {
  intent: ClassifiedIntent;
  reason: string;
};

const FAQ_SIGNALS =
  /\b(faq|help center|how do i|what is your|return policy|refund policy|shipping policy|payment method|warranty|store hours|contact support|do you ship|international shipping|password reset|account help|where can i find|tell me about your)\b/i;

const GENERAL_QUESTION =
  /^(what|how|when|where|why|can i|do you|is there|are there)\b/i;

export function classifyIntent(input: {
  message: string;
  leadSession?: LeadSession;
}): IntentClassification {
  const message = input.message.trim();
  const session = input.leadSession;

  if (session?.active || isLeadCaptureTrigger(message)) {
    return { intent: "LEAD", reason: "lead_capture_flow" };
  }

  if (isOrderSupportQuery(message)) {
    return { intent: "ORDER_SUPPORT", reason: "order_support_keywords" };
  }

  if (isProductRecommendationQuery(message)) {
    return { intent: "PRODUCT_SEARCH", reason: "product_search_keywords" };
  }

  if (FAQ_SIGNALS.test(message)) {
    return { intent: "FAQ", reason: "faq_or_policy_keywords" };
  }

  if (message.endsWith("?") && GENERAL_QUESTION.test(message)) {
    return { intent: "FAQ", reason: "general_question_format" };
  }

  return { intent: "GENERAL_CHAT", reason: "default" };
}

export function mapClassifiedIntentToLegacy(
  intent: ClassifiedIntent,
): "general" | "product_recommendation" | "order_support" | "lead_capture" {
  switch (intent) {
    case "PRODUCT_SEARCH":
      return "product_recommendation";
    case "ORDER_SUPPORT":
      return "order_support";
    case "LEAD":
      return "lead_capture";
    case "FAQ":
    case "GENERAL_CHAT":
    default:
      return "general";
  }
}
