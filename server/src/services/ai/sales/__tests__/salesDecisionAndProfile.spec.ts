jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    salesCustomerProfile: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    salesAgentOffer: { findMany: jest.fn(), count: jest.fn() },
    salesEmailJob: { count: jest.fn(), findMany: jest.fn() },
  },
}));
jest.mock("../../../../config/email", () => ({ isEmailConfigured: jest.fn(), sendTransactionalEmail: jest.fn() }));
jest.mock("../../../lead/leadService", () => ({ createLead: jest.fn() }));
jest.mock("../../../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { SalesCustomerSegment } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { isEmailConfigured, sendTransactionalEmail } from "../../../../config/email";
import { createLead } from "../../../lead/leadService";
import { decideSalesActions, formatSegmentLabel, resolveCustomerSegment } from "../SalesDecisionService";
import {
  attachEmailToProfile,
  fetchSegmentBreakdown,
  incrementProfileOfferCount,
  markProfilesConverted,
  upsertSalesCustomerProfile,
} from "../CustomerProfileService";
import { createSalesLead, sendSalesFollowUpEmail } from "../SalesFollowUpService";
import { fetchSalesAgentAdminDashboard } from "../SalesAgentAdminService";
import type { BehaviorSignals } from "../types";

const profile = prisma.salesCustomerProfile as unknown as Record<string, jest.Mock>;
const offers = prisma.salesAgentOffer as unknown as Record<string, jest.Mock>;
const jobs = prisma.salesEmailJob as unknown as Record<string, jest.Mock>;

function signals(overrides: Partial<BehaviorSignals> = {}): BehaviorSignals {
  return {
    sessionId: "sess-1",
    viewedProductIds: [],
    viewedProducts: [],
    browsingMinutes: 0,
    returnVisitDays: 0,
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

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("SalesDecisionService", () => {
  it.each<[string, Partial<BehaviorSignals>, number, SalesCustomerSegment]>([
    ["converted wins over everything", { hasOrderComplete: true, cartAbandoned: true }, 99, SalesCustomerSegment.CONVERTED],
    ["cart abandoner", { cartAbandoned: true, returnVisitDays: 5 }, 99, SalesCustomerSegment.CART_ABANDONER],
    ["return visitor", { returnVisitDays: 2 }, 99, SalesCustomerSegment.RETURN_VISITOR],
    ["high intent at 70", {}, 70, SalesCustomerSegment.HIGH_INTENT],
    ["browser below 70", {}, 69, SalesCustomerSegment.BROWSER],
  ])("segments %s", (_label, overrides, score, expected) => {
    expect(resolveCustomerSegment(signals(overrides), score)).toBe(expected);
  });

  it("enforces cooldown, triggers and score threshold in that order", () => {
    const base = signals({ triggers: ["CART_ABANDON"], cartAbandoned: true, email: "a@b.co" });
    expect(decideSalesActions({ signals: base, intentScore: 90, hasRecentOffer: true }).reason).toBe("recent_offer_cooldown");
    expect(
      decideSalesActions({ signals: signals(), intentScore: 90, hasRecentOffer: false }).reason
    ).toBe("no_behavior_triggers");
    expect(decideSalesActions({ signals: base, intentScore: 39, hasRecentOffer: false }).reason).toBe(
      "intent_score_below_threshold"
    );
    expect(decideSalesActions({ signals: base, intentScore: 40, hasRecentOffer: false })).toEqual({
      shouldCreateOffer: true,
      shouldQueueEmails: true,
      segment: SalesCustomerSegment.CART_ABANDONER,
    });
  });

  it("does not queue emails without an address", () => {
    const decision = decideSalesActions({
      signals: signals({ triggers: ["HIGH_BROWSING"] }),
      intentScore: 80,
      hasRecentOffer: false,
    });
    expect(decision).toMatchObject({ shouldCreateOffer: true, shouldQueueEmails: false });
  });

  it("formats segment labels", () => {
    expect(formatSegmentLabel(SalesCustomerSegment.CART_ABANDONER)).toBe("Cart Abandoner");
    expect(formatSegmentLabel(SalesCustomerSegment.BROWSER)).toBe("Browser");
  });
});

describe("CustomerProfileService", () => {
  it("upserts by visitorId when present", async () => {
    await upsertSalesCustomerProfile({ signals: signals({ visitorId: "v1", userId: "u1" }), intentScore: 50, email: "a@b.co" });
    const args = profile.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ visitorId: "v1" });
    expect(args.create).toMatchObject({ visitorId: "v1", userId: "u1", email: "a@b.co", intentScore: 50 });
  });

  it("upserts by userId when there is no visitorId", async () => {
    await upsertSalesCustomerProfile({ signals: signals({ userId: "u1" }), intentScore: 10 });
    expect(profile.upsert.mock.calls[0][0].where).toEqual({ userId: "u1" });
  });

  it("does nothing for an anonymous session with no ids", async () => {
    await upsertSalesCustomerProfile({ signals: signals(), intentScore: 10 });
    expect(profile.upsert).not.toHaveBeenCalled();
  });

  it("attaches a normalized email to an existing profile", async () => {
    profile.findFirst.mockResolvedValue({ id: "prof-1" });
    await attachEmailToProfile({ sessionId: "s", visitorId: "v", email: "  Ann@X.IO " });
    expect(profile.findFirst.mock.calls[0][0].where.OR).toEqual([{ sessionId: "s" }, { visitorId: "v" }]);
    expect(profile.update.mock.calls[0][0]).toMatchObject({ where: { id: "prof-1" }, data: { email: "ann@x.io" } });
    expect(profile.create).not.toHaveBeenCalled();
  });

  it("creates a profile when none exists", async () => {
    profile.findFirst.mockResolvedValue(null);
    await attachEmailToProfile({ sessionId: "s", userId: "u", email: "A@B.CO" });
    expect(profile.create.mock.calls[0][0].data).toMatchObject({ userId: "u", visitorId: null, email: "a@b.co" });
  });

  it("increments the offer count only for an identified profile", async () => {
    await incrementProfileOfferCount({});
    expect(profile.updateMany).not.toHaveBeenCalled();
    await incrementProfileOfferCount({ userId: "u1" });
    expect(profile.updateMany).toHaveBeenCalledWith({ where: { userId: "u1" }, data: { offerCount: { increment: 1 } } });
  });

  it("marks matching profiles converted, and is a no-op without ids", async () => {
    await markProfilesConverted({});
    expect(profile.updateMany).not.toHaveBeenCalled();
    await markProfilesConverted({ userId: "u", sessionId: "s" });
    expect(profile.updateMany.mock.calls[0][0]).toMatchObject({
      where: { OR: [{ userId: "u" }, { sessionId: "s" }] },
      data: { segment: SalesCustomerSegment.CONVERTED, intentScore: 100 },
    });
  });

  it("maps the segment breakdown", async () => {
    profile.groupBy.mockResolvedValue([{ segment: "BROWSER", _count: { segment: 4 } }]);
    await expect(fetchSegmentBreakdown(new Date(), new Date())).resolves.toEqual([{ segment: "BROWSER", count: 4 }]);
  });
});

describe("SalesFollowUpService", () => {
  const email = { to: "a@b.co", intentSummary: "Likes laptops", couponCode: "SAVE-1", discountPercent: 10, productNames: ["Mac"] };

  it("skips sending when email is not configured", async () => {
    (isEmailConfigured as jest.Mock).mockReturnValue(false);
    await expect(sendSalesFollowUpEmail(email)).resolves.toBe(false);
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("sends the coupon line and product list", async () => {
    (isEmailConfigured as jest.Mock).mockReturnValue(true);
    await expect(sendSalesFollowUpEmail(email)).resolves.toBe(true);
    const { text, to } = (sendTransactionalEmail as jest.Mock).mock.calls[0][0];
    expect(to).toBe("a@b.co");
    expect(text).toContain("Use code SAVE-1 for 10% off");
    expect(text).toContain("- Mac");
  });

  it("uses a generic line without a coupon and returns false on send failure", async () => {
    (isEmailConfigured as jest.Mock).mockReturnValue(true);
    (sendTransactionalEmail as jest.Mock).mockRejectedValue(new Error("smtp down"));
    await expect(sendSalesFollowUpEmail({ ...email, couponCode: null, productNames: [] })).resolves.toBe(false);
    expect((sendTransactionalEmail as jest.Mock).mock.calls[0][0].text).toContain("We saved a personalized selection");
  });

  it("creates a lead and swallows lead failures", async () => {
    (createLead as jest.Mock).mockResolvedValue({ id: "lead-1" });
    await expect(
      createSalesLead({ email: "a@b.co", intentSummary: "x", triggerReason: "CART_ABANDON", couponCode: null })
    ).resolves.toBe("lead-1");
    expect((createLead as jest.Mock).mock.calls[0][0].message).toBe("[AI Sales Agent]\nx\nTrigger: CART_ABANDON");

    (createLead as jest.Mock).mockRejectedValue(new Error("db"));
    await expect(
      createSalesLead({ email: "a@b.co", intentSummary: "x", triggerReason: "t", couponCode: "C" })
    ).resolves.toBeNull();
  });
});

describe("fetchSalesAgentAdminDashboard", () => {
  it("summarizes offers, buckets scores and serializes dates", async () => {
    const createdAt = new Date("2026-03-01T10:00:00Z");
    offers.findMany.mockResolvedValue([
      { id: "o1", intentScore: 85, segment: "HIGH_INTENT", intentSummary: "", triggerReason: "CART_ABANDON", status: "CONVERTED", email: null, couponCode: "C1", createdAt },
      { id: "o2", intentScore: 65, segment: "BROWSER", intentSummary: "", triggerReason: "CART_ABANDON", status: "SHOWN", email: null, couponCode: "C2", createdAt },
      { id: "o3", intentScore: 30, segment: "BROWSER", intentSummary: "", triggerReason: "HIGH_BROWSING", status: "PENDING", email: null, couponCode: "C3", createdAt },
    ]);
    offers.count.mockResolvedValue(0);
    jobs.count.mockResolvedValueOnce(8).mockResolvedValueOnce(5).mockResolvedValueOnce(1);
    profile.groupBy.mockResolvedValue([{ segment: "HIGH_INTENT", _count: { segment: 2 } }]);
    jobs.findMany.mockResolvedValue([
      { id: "j1", toEmail: "a@b.co", jobType: "FOLLOW_UP_1H", status: "SENT", scheduledAt: createdAt, sentAt: null, attempts: 1 },
    ]);

    const result = await fetchSalesAgentAdminDashboard("7d");

    expect(result.summary).toEqual({
      offersGenerated: 3,
      offersShown: 2,
      offersConverted: 1,
      emailsQueued: 8,
      emailsSent: 5,
      emailsFailed: 1,
      avgIntentScore: 60,
      offerConversionRate: 50,
      offersChangePercent: 100,
    });
    expect(result.triggerBreakdown).toEqual([
      { trigger: "CART_ABANDON", count: 2 },
      { trigger: "HIGH_BROWSING", count: 1 },
    ]);
    expect(result.scoreDistribution).toEqual([
      { bucket: "80-100", count: 1 },
      { bucket: "60-79", count: 1 },
      { bucket: "0-39", count: 1 },
    ]);
    expect(result.segmentBreakdown).toEqual([{ segment: "HIGH_INTENT", label: "High Intent", count: 2 }]);
    expect(result.recentOffers[0].createdAt).toBe("2026-03-01T10:00:00.000Z");
    expect(result.recentEmailJobs[0]).toMatchObject({ scheduledAt: "2026-03-01T10:00:00.000Z", sentAt: null });
  });

  it("returns zero rates with no offers", async () => {
    offers.findMany.mockResolvedValue([]);
    offers.count.mockResolvedValue(0);
    jobs.count.mockResolvedValue(0);
    profile.groupBy.mockResolvedValue([]);
    jobs.findMany.mockResolvedValue([]);
    const { summary } = await fetchSalesAgentAdminDashboard("bogus");
    expect(summary).toMatchObject({ avgIntentScore: 0, offerConversionRate: 0, offersChangePercent: 0 });
  });
});
