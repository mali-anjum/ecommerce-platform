jest.mock("../../../lib/prisma", () => ({
  prisma: {
    aiConversationLog: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

import { prisma } from "../../../lib/prisma";
import { fetchAiMetricsSummary } from "../aiAnalyticsService";

const mockCount = prisma.aiConversationLog.count as jest.Mock;
const mockGroupBy = prisma.aiConversationLog.groupBy as jest.Mock;

describe("fetchAiMetricsSummary", () => {
  beforeEach(() => {
    mockCount.mockReset();
    mockGroupBy.mockReset();
  });

  it("returns chat usage, conversion rate, and top intents", async () => {
    mockCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(12);
    mockGroupBy.mockResolvedValue([
      { intent: "product_recommendation", _count: { intent: 40 } },
      { intent: "general", _count: { intent: 35 } },
    ]);

    const start = new Date("2026-05-01");
    const end = new Date("2026-05-31");
    const previousStart = new Date("2026-04-01");
    const previousEnd = new Date("2026-04-30");

    const result = await fetchAiMetricsSummary(
      start,
      end,
      previousStart,
      previousEnd,
    );

    expect(result).toEqual({
      chatUsageCount: 100,
      chatUsageChangePercent: 25,
      conversionRate: 12,
      convertedChats: 12,
      topIntents: [
        { intent: "product_recommendation", count: 40 },
        { intent: "general", count: 35 },
      ],
    });
  });

  it("returns zero conversion when there are no chats", async () => {
    mockCount.mockResolvedValue(0);
    mockGroupBy.mockResolvedValue([]);

    const result = await fetchAiMetricsSummary(
      new Date(),
      new Date(),
      new Date(),
      new Date(),
    );

    expect(result.conversionRate).toBe(0);
    expect(result.topIntents).toEqual([]);
  });
});
