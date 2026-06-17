import { SalesCustomerSegment } from "@prisma/client";
import type { BehaviorSignals } from "./types";
import { meetsOfferScoreThreshold } from "./IntentScoringEngine";

export function resolveCustomerSegment(
  signals: BehaviorSignals,
  intentScore: number,
): SalesCustomerSegment {
  if (signals.hasOrderComplete) {
    return SalesCustomerSegment.CONVERTED;
  }
  if (signals.cartAbandoned) {
    return SalesCustomerSegment.CART_ABANDONER;
  }
  if (signals.returnVisitDays >= 2) {
    return SalesCustomerSegment.RETURN_VISITOR;
  }
  if (intentScore >= 70) {
    return SalesCustomerSegment.HIGH_INTENT;
  }
  return SalesCustomerSegment.BROWSER;
}

export type SalesDecision = {
  shouldCreateOffer: boolean;
  shouldQueueEmails: boolean;
  segment: SalesCustomerSegment;
  reason?: string;
};

export function decideSalesActions(input: {
  signals: BehaviorSignals;
  intentScore: number;
  hasRecentOffer: boolean;
}): SalesDecision {
  const segment = resolveCustomerSegment(input.signals, input.intentScore);
  const hasTriggers = input.signals.triggers.length > 0;

  if (input.hasRecentOffer) {
    return {
      shouldCreateOffer: false,
      shouldQueueEmails: false,
      segment,
      reason: "recent_offer_cooldown",
    };
  }

  if (!hasTriggers) {
    return {
      shouldCreateOffer: false,
      shouldQueueEmails: false,
      segment,
      reason: "no_behavior_triggers",
    };
  }

  if (!meetsOfferScoreThreshold(input.intentScore)) {
    return {
      shouldCreateOffer: false,
      shouldQueueEmails: false,
      segment,
      reason: "intent_score_below_threshold",
    };
  }

  return {
    shouldCreateOffer: true,
    shouldQueueEmails: Boolean(input.signals.email),
    segment,
  };
}

export function formatSegmentLabel(segment: SalesCustomerSegment): string {
  return segment
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
