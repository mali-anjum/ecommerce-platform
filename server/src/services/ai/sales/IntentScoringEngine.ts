import type { BehaviorSignals, IntentScoreBreakdown } from "./types";
import { SALES_AGENT_CONSTANTS } from "./types";

function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

export function computeIntentScore(signals: BehaviorSignals): IntentScoreBreakdown {
  const productViews = clamp(signals.viewedProductIds.length * 10, 30);
  const browsing = clamp(signals.browsingMinutes * 2, 20);
  const cartAbandon = signals.cartAbandoned ? 25 : 0;
  const returnVisits =
    signals.returnVisitDays >= SALES_AGENT_CONSTANTS.MIN_RETURN_VISIT_DAYS
      ? clamp((signals.returnVisitDays - 1) * 10, 20)
      : 0;
  const chat = clamp(signals.chatCount * 15, 15);
  const cartAdds = clamp(signals.cartAddCount * 10, 20);

  const total = Math.min(
    100,
    productViews + browsing + cartAbandon + returnVisits + chat + cartAdds,
  );

  return {
    productViews,
    browsing,
    cartAbandon,
    returnVisits,
    chat,
    cartAdds,
    total,
  };
}

export function meetsOfferScoreThreshold(score: number): boolean {
  return score >= SALES_AGENT_CONSTANTS.MIN_INTENT_SCORE_FOR_OFFER;
}

export function meetsEmailScoreThreshold(score: number): boolean {
  return score >= SALES_AGENT_CONSTANTS.MIN_INTENT_SCORE_FOR_EMAIL;
}

export function shouldPromptGuestEmailCapture(
  score: number,
  hasEmail: boolean,
  triggerCount: number,
): boolean {
  if (hasEmail || triggerCount === 0) return false;
  return score >= SALES_AGENT_CONSTANTS.MIN_INTENT_SCORE_FOR_CAPTURE_EMAIL;
}
