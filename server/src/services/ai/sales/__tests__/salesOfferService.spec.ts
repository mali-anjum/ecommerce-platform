jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    salesAgentOffer: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    salesEmailJob: { count: jest.fn() },
    coupon: { create: jest.fn() },
    product: { findMany: jest.fn() },
  },
}));
jest.mock("../../../../config/featureFlags", () => ({ isFeatureEnabled: jest.fn() }));
jest.mock("../../recommendations/ProductRecommendationService", () => ({ getProductRecommendations: jest.fn() }));
jest.mock("../BuyingIntentAnalyzer", () => ({ analyzeBuyingIntent: jest.fn() }));
jest.mock("../BehaviorSignalService", () => ({
  collectBehaviorSignals: jest.fn(),
  pickPrimaryTrigger: jest.requireActual("../BehaviorSignalService").pickPrimaryTrigger,
}));
jest.mock("../CustomerProfileService", () => ({
  attachEmailToProfile: jest.fn(),
  incrementProfileOfferCount: jest.fn(),
  markProfilesConverted: jest.fn(),
  upsertSalesCustomerProfile: jest.fn(),
}));
jest.mock("../SalesEmailQueueService", () => ({
  cancelPendingEmailsForOffer: jest.fn(),
  enqueueSalesEmailSequence: jest.fn(),
}));
jest.mock("../SalesFollowUpService", () => ({ createSalesLead: jest.fn() }));
jest.mock("../../../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { prisma } from "../../../../lib/prisma";
import { isFeatureEnabled } from "../../../../config/featureFlags";
import { getProductRecommendations } from "../../recommendations/ProductRecommendationService";
import { analyzeBuyingIntent } from "../BuyingIntentAnalyzer";
import { collectBehaviorSignals } from "../BehaviorSignalService";
import { attachEmailToProfile, incrementProfileOfferCount, markProfilesConverted } from "../CustomerProfileService";
import { cancelPendingEmailsForOffer, enqueueSalesEmailSequence } from "../SalesEmailQueueService";
import { createSalesLead } from "../SalesFollowUpService";
import { sentryTracker } from "../../../../lib/monitoring";
import {
  captureGuestEmailForSales,
  dismissOffer,
  evaluateSalesAgentOffer,
  fetchSalesAgentSummary,
  getPendingOffersForSession,
  getSalesAgentContext,
  markOfferShown,
  markSalesOffersConverted,
} from "../SalesOfferService";
import type { BehaviorSignals } from "../types";

const offers = prisma.salesAgentOffer as unknown as Record<string, jest.Mock>;
const coupons = prisma.coupon as unknown as Record<string, jest.Mock>;
const products = prisma.product as unknown as Record<string, jest.Mock>;
const flags = isFeatureEnabled as jest.Mock;

const SESSION = "abcd1234-ef56-7890-abcd-ef1234567890";

function strongSignals(overrides: Partial<BehaviorSignals> = {}): BehaviorSignals {
  return {
    sessionId: SESSION,
    email: "ann@x.io",
    viewedProductIds: ["p1", "p2", "p3"],
    viewedProducts: [],
    browsingMinutes: 10,
    returnVisitDays: 0,
    cartAbandoned: true,
    cartProductIds: ["p1"],
    cartAddCount: 1,
    chatCount: 0,
    hasOrderComplete: false,
    estimatedCartValue: 0,
    triggers: ["PRODUCT_CLUSTER", "CART_ABANDON"],
    ...overrides,
  };
}

function rec(id: string) {
  return { id, name: `Product ${id}` };
}

describe("SalesOfferService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    flags.mockReturnValue(true);
    offers.findFirst.mockResolvedValue(null);
    offers.findMany.mockResolvedValue([]);
    (collectBehaviorSignals as jest.Mock).mockResolvedValue(strongSignals());
    (analyzeBuyingIntent as jest.Mock).mockResolvedValue({
      intentSummary: "Shopping for a laptop",
      themeKeywords: ["laptop"],
      complementaryCategories: ["Accessories"],
    });
    (getProductRecommendations as jest.Mock).mockResolvedValue({ products: [rec("p1"), rec("p9")] });
    coupons.create.mockImplementation(({ data }: { data: { code: string; discountPercent: number } }) =>
      Promise.resolve({ id: "c1", ...data })
    );
    offers.create.mockResolvedValue({ id: "offer-1" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("evaluateSalesAgentOffer", () => {
    it("returns null when the sales agent flag is off or there is no session", async () => {
      flags.mockReturnValue(false);
      await expect(evaluateSalesAgentOffer({ sessionId: SESSION })).resolves.toBeNull();
      flags.mockReturnValue(true);
      await expect(evaluateSalesAgentOffer({ sessionId: "" })).resolves.toBeNull();
      expect(collectBehaviorSignals).not.toHaveBeenCalled();
    });

    it("creates a single-use coupon, the offer, and queues the email drip", async () => {
      const result = await evaluateSalesAgentOffer({ sessionId: SESSION, userId: "u1" });

      const couponData = coupons.create.mock.calls[0][0].data;
      expect(couponData).toMatchObject({ discountPercent: 10, usageLimit: 1, usageCount: 0, isActive: true });
      expect(couponData.code).toMatch(/^SAVE-ABCD12[0-9A-F]{6}$/);
      expect(couponData.endDate.getTime() - couponData.startDate.getTime()).toBe(7 * 24 * 60 * 60 * 1000);

      // Already-viewed products are not re-recommended.
      expect(result?.products.map((p) => p.id)).toEqual(["p9"]);
      expect(result).toMatchObject({ id: "offer-1", triggerReason: "CART_ABANDON", couponCode: couponData.code, discountPercent: 10 });
      expect(offers.create.mock.calls[0][0].data).toMatchObject({ sessionId: SESSION, userId: "u1", status: "PENDING", recommendedProductIds: ["p9"] });
      expect(incrementProfileOfferCount).toHaveBeenCalledWith({ visitorId: undefined, userId: "u1" });
      expect(enqueueSalesEmailSequence).toHaveBeenCalledWith(
        expect.objectContaining({ offerId: "offer-1", toEmail: "ann@x.io", payload: expect.objectContaining({ productNames: ["Product p9"] }) })
      );
      expect(createSalesLead).toHaveBeenCalled();
    });

    it("generates distinct coupon codes for repeat offers in the same session", async () => {
      await evaluateSalesAgentOffer({ sessionId: SESSION });
      await evaluateSalesAgentOffer({ sessionId: SESSION });
      const [first, second] = coupons.create.mock.calls.map((c) => c[0].data.code);
      expect(first).not.toBe(second);
    });

    it("respects the 24h cooldown", async () => {
      offers.findFirst.mockResolvedValue({ id: "recent" });
      await expect(evaluateSalesAgentOffer({ sessionId: SESSION, visitorId: "v1" })).resolves.toBeNull();
      expect(coupons.create).not.toHaveBeenCalled();
      expect(offers.findFirst.mock.calls[0][0].where.OR).toEqual([{ sessionId: SESSION }, { visitorId: "v1" }]);
    });

    it("does not create an offer for low intent", async () => {
      (collectBehaviorSignals as jest.Mock).mockResolvedValue(
        strongSignals({ viewedProductIds: [], browsingMinutes: 0, cartAbandoned: false, cartAddCount: 0, triggers: ["HIGH_BROWSING"] })
      );
      await expect(evaluateSalesAgentOffer({ sessionId: SESSION })).resolves.toBeNull();
      expect(coupons.create).not.toHaveBeenCalled();
    });

    it("does not queue emails for a guest without an email", async () => {
      (collectBehaviorSignals as jest.Mock).mockResolvedValue(strongSignals({ email: undefined }));
      await expect(evaluateSalesAgentOffer({ sessionId: SESSION })).resolves.not.toBeNull();
      expect(enqueueSalesEmailSequence).not.toHaveBeenCalled();
      expect(createSalesLead).not.toHaveBeenCalled();
    });

    it("returns null and reports when anything throws", async () => {
      coupons.create.mockRejectedValue(new Error("unique constraint"));
      await expect(evaluateSalesAgentOffer({ sessionId: SESSION })).resolves.toBeNull();
      expect(sentryTracker).toHaveBeenCalled();
      expect(offers.create).not.toHaveBeenCalled();
    });
  });

  describe("getSalesAgentContext", () => {
    it("returns score, segment, capture prompt and pending offers", async () => {
      (collectBehaviorSignals as jest.Mock).mockResolvedValue(strongSignals({ email: undefined }));
      offers.findMany.mockResolvedValue([
        {
          id: "o1",
          intentSummary: "s",
          intentScore: 80,
          segment: "CART_ABANDONER",
          triggerReason: "CART_ABANDON",
          couponCode: "C",
          discountPercent: 10,
          recommendedProductIds: ["p9", 5],
        },
      ]);
      products.findMany.mockResolvedValue([
        { id: "p9", name: "Bag", brand: "B", price: 100, discountPercent: 20, images: [], category: "Bags", stock: 2, rating: null },
      ]);

      const context = await getSalesAgentContext({ sessionId: SESSION });

      expect(context).toMatchObject({ segment: "CART_ABANDONER", shouldCaptureEmail: true });
      expect(context?.intentScore).toBeGreaterThanOrEqual(45);
      expect(context?.offers[0].products[0]).toMatchObject({ id: "p9", effectivePrice: 80 });
      expect(products.findMany.mock.calls[0][0].where).toMatchObject({ id: { in: ["p9"] }, isActive: true, stock: { gt: 0 } });
    });

    it("returns null when disabled or on error", async () => {
      flags.mockReturnValue(false);
      await expect(getSalesAgentContext({ sessionId: SESSION })).resolves.toBeNull();
      flags.mockReturnValue(true);
      (collectBehaviorSignals as jest.Mock).mockRejectedValue(new Error("db"));
      await expect(getSalesAgentContext({ sessionId: SESSION })).resolves.toBeNull();
    });
  });

  describe("captureGuestEmailForSales", () => {
    it("attaches the email to an existing pending offer and queues emails", async () => {
      offers.findFirst.mockResolvedValue({
        id: "o1",
        intentScore: 70,
        intentSummary: "s",
        couponCode: "C",
        discountPercent: 10,
        triggerReason: "CART_ABANDON",
        recommendedProductIds: ["p9"],
      });
      products.findMany.mockResolvedValue([{ name: "Bag" }]);

      await expect(captureGuestEmailForSales({ sessionId: SESSION, email: " Ann@X.IO " })).resolves.toEqual({
        queued: true,
        offerId: "o1",
      });
      expect(attachEmailToProfile).toHaveBeenCalledWith(expect.objectContaining({ email: "ann@x.io" }));
      expect(offers.update).toHaveBeenCalledWith({ where: { id: "o1" }, data: { email: "ann@x.io" } });
      expect(enqueueSalesEmailSequence).toHaveBeenCalledWith(
        expect.objectContaining({ toEmail: "ann@x.io", payload: expect.objectContaining({ productNames: ["Bag"] }) })
      );
    });

    it("evaluates a new offer when none is pending and attaches the email", async () => {
      offers.findFirst.mockResolvedValue(null);
      (collectBehaviorSignals as jest.Mock).mockResolvedValue(strongSignals({ email: undefined }));
      offers.findUnique.mockResolvedValue({ id: "offer-1", email: null });

      await expect(captureGuestEmailForSales({ sessionId: SESSION, email: "g@x.io" })).resolves.toEqual({
        queued: true,
        offerId: "offer-1",
      });
      expect(offers.update).toHaveBeenCalledWith({ where: { id: "offer-1" }, data: { email: "g@x.io" } });
      expect(enqueueSalesEmailSequence).toHaveBeenCalledTimes(1);
    });

    it("reports not queued when no offer qualifies", async () => {
      offers.findFirst.mockResolvedValue(null);
      flags.mockReturnValue(false);
      await expect(captureGuestEmailForSales({ sessionId: SESSION, email: "g@x.io" })).resolves.toEqual({
        queued: false,
        offerId: undefined,
      });
    });
  });

  it("scopes shown/dismissed updates to the caller's session", async () => {
    await markOfferShown("o1", SESSION);
    expect(offers.updateMany.mock.calls[0][0].where).toEqual({ id: "o1", sessionId: SESSION, status: { in: ["PENDING", "EMAIL_SENT"] } });

    await dismissOffer("o1", SESSION);
    expect(offers.updateMany.mock.calls[1][0]).toEqual({ where: { id: "o1", sessionId: SESSION }, data: { status: "DISMISSED" } });
    expect(cancelPendingEmailsForOffer).toHaveBeenCalledWith("o1");
  });

  describe("markSalesOffersConverted", () => {
    it("is a no-op without identifiers", async () => {
      await markSalesOffersConverted({});
      expect(offers.findMany).not.toHaveBeenCalled();
      expect(markProfilesConverted).not.toHaveBeenCalled();
    });

    it("converts open offers, cancels their emails and converts profiles", async () => {
      offers.findMany.mockResolvedValue([{ id: "o1" }, { id: "o2" }]);
      await markSalesOffersConverted({ userId: "u1" });
      expect(offers.updateMany.mock.calls[0][0]).toEqual({
        where: { OR: [{ userId: "u1" }], status: { notIn: ["CONVERTED", "DISMISSED"] } },
        data: { status: "CONVERTED" },
      });
      expect(cancelPendingEmailsForOffer).toHaveBeenCalledTimes(2);
      expect(markProfilesConverted).toHaveBeenCalledWith({ userId: "u1" });
    });
  });

  it("returns no pending offers for a fresh session", async () => {
    await expect(getPendingOffersForSession(SESSION)).resolves.toEqual([]);
  });

  it("summarizes sales agent metrics", async () => {
    offers.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4).mockResolvedValueOnce(3).mockResolvedValueOnce(2);
    offers.aggregate.mockResolvedValue({ _avg: { intentScore: 61.6 } });
    (prisma.salesEmailJob.count as jest.Mock).mockResolvedValueOnce(12).mockResolvedValueOnce(1);
    await expect(fetchSalesAgentSummary(new Date(), new Date())).resolves.toEqual({
      offersGenerated: 10,
      emailsSent: 4,
      offersShown: 3,
      offersConverted: 2,
      avgIntentScore: 62,
      emailsQueued: 12,
      emailsFailed: 1,
    });
  });
});
