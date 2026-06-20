import { ProductReviewStatus } from "@prisma/client";

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    productReview: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../reviews/ReviewThemeClassifier", () => ({
  classifyReviewWithRules: jest.fn((input: { rating: number; body: string }) => ({
    themes: input.body.includes("battery") ? ["battery_life"] : ["other"],
    sentiment: input.rating <= 2 ? "negative" : "positive",
  })),
  classifyReviewsBatch: jest.fn(),
}));

import { prisma } from "../../../lib/prisma";
import { buildReviewAnalyzerReport } from "../reviews/ReviewAnalyzerService";

const findMany = prisma.productReview.findMany as jest.Mock;
const count = prisma.productReview.count as jest.Mock;

describe("buildReviewAnalyzerReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    count.mockResolvedValue(0);
  });

  it("ranks top complaints from themed reviews", async () => {
    const now = new Date();
    findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "r1",
          rating: 2,
          body: "Battery bad",
          themes: ["battery_life"],
          sentiment: "negative",
          analyzedAt: now,
          createdAt: now,
          product: { name: "Phone X" },
        },
        {
          id: "r2",
          rating: 2,
          body: "Packaging damaged",
          themes: ["packaging_damage"],
          sentiment: "negative",
          analyzedAt: now,
          createdAt: now,
          product: { name: "Phone X" },
        },
        {
          id: "r3",
          rating: 2,
          body: "Delivery slow",
          themes: ["delivery_delays"],
          sentiment: "negative",
          analyzedAt: now,
          createdAt: now,
          product: { name: "Phone X" },
        },
      ]);

    const report = await buildReviewAnalyzerReport("30d");

    expect(report.summary.totalReviews).toBe(3);
    expect(report.topComplaints[0]?.theme).toBe("battery_life");
    expect(report.topComplaints[0]?.label).toBe("Battery life");
    expect(report.reportNarrative).toContain("Battery life");
  });

  it("returns empty-state narrative when no reviews", async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);

    const report = await buildReviewAnalyzerReport("7d");

    expect(report.summary.totalReviews).toBe(0);
    expect(report.reportNarrative).toContain("No approved reviews");
  });
});
