import type { ClassifiedIntent } from "@/lib/assistant/types";

export function isProductSearchIntent(intent?: ClassifiedIntent): boolean {
  return intent === "PRODUCT_SEARCH";
}

export function isOrderSupportIntent(intent?: ClassifiedIntent): boolean {
  return intent === "ORDER_SUPPORT";
}

export function isLeadCaptureIntent(intent?: ClassifiedIntent): boolean {
  return intent === "LEAD";
}

export function isHumanHandoffIntent(intent?: ClassifiedIntent): boolean {
  return intent === "HUMAN_HANDOFF";
}
