jest.mock("../../../lib/prisma", () => ({
  prisma: {
    analyticsEvent: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "../../../lib/prisma";
import { fetchFunnelTrackingSummary } from "../funnelAnalyticsService";

const mockFindMany = prisma.analyticsEvent.findMany as jest.Mock;

describe("fetchFunnelTrackingSummary", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("computes step and overall conversion rates from session journeys", async () => {
    mockFindMany.mockResolvedValue([
      { id: "1", type: "CHAT", sessionId: "s1", userId: null },
      { id: "2", type: "PRODUCT_VIEW", sessionId: "s1", userId: null },
      { id: "3", type: "CART_ADD", sessionId: "s1", userId: null },
      { id: "4", type: "ORDER_COMPLETE", sessionId: "s1", userId: null },
      { id: "5", type: "CHAT", sessionId: "s2", userId: null },
      { id: "6", type: "PRODUCT_VIEW", sessionId: "s2", userId: null },
      { id: "7", type: "CHAT", sessionId: null, userId: "u1" },
    ]);

    const result = await fetchFunnelTrackingSummary(
      new Date("2026-05-01"),
      new Date("2026-05-31"),
    );

    expect(result.chat).toBe(3);
    expect(result.productView).toBe(2);
    expect(result.sessionCounts.startedChat).toBe(3);
    expect(result.sessionCounts.reachedProductView).toBe(2);
    expect(result.sessionCounts.reachedCart).toBe(1);
    expect(result.sessionCounts.completedOrder).toBe(1);
    expect(result.chatToProductViewRate).toBe(66.7);
    expect(result.overallConversionRate).toBe(33.3);
  });
});
