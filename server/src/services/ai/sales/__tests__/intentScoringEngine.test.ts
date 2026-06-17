import { computeIntentScore, meetsOfferScoreThreshold } from "../IntentScoringEngine";
import type { BehaviorSignals } from "../types";
import { SalesOfferTrigger } from "@prisma/client";

function baseSignals(overrides: Partial<BehaviorSignals> = {}): BehaviorSignals {
  return {
    sessionId: "session-1",
    viewedProductIds: [],
    viewedProducts: [],
    browsingMinutes: 0,
    returnVisitDays: 1,
    cartAbandoned: false,
    cartProductIds: [],
    cartAddCount: 0,
    chatCount: 0,
    hasOrderComplete: false,
    estimatedCartValue: 0,
    triggers: [],
    ...overrides,
  };
}

describe("computeIntentScore", () => {
  it("scores high for cart abandon plus multiple product views", () => {
    const score = computeIntentScore(
      baseSignals({
        viewedProductIds: ["a", "b", "c"],
        browsingMinutes: 8,
        cartAbandoned: true,
        cartAddCount: 1,
        triggers: [SalesOfferTrigger.CART_ABANDON, SalesOfferTrigger.PRODUCT_CLUSTER],
      }),
    );

    expect(score.total).toBeGreaterThanOrEqual(55);
    expect(score.cartAbandon).toBe(25);
    expect(score.productViews).toBe(30);
  });

  it("meets offer threshold at 40+", () => {
    const score = computeIntentScore(
      baseSignals({
        viewedProductIds: ["a", "b", "c"],
        browsingMinutes: 6,
        cartAbandoned: true,
        triggers: [SalesOfferTrigger.PRODUCT_CLUSTER, SalesOfferTrigger.HIGH_BROWSING],
      }),
    );

    expect(meetsOfferScoreThreshold(score.total)).toBe(true);
  });
});
