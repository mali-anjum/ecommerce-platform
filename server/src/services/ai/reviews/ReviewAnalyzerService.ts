import { ProductReviewStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import {
  parseAnalyticsPeriod,
  percentChange,
  resolveAnalyticsDateRange,
} from "../../analytics/period";
import { themeLabelForSlug } from "./ReviewThemeTaxonomy";
import {
  classifyReviewWithRules,
  classifyReviewsBatch,
} from "./ReviewThemeClassifier";

export type ReviewComplaintRank = {
  theme: string;
  label: string;
  count: number;
  sharePercent: number;
  changePercent: number | null;
  sampleQuotes: string[];
};

export type ReviewTrendPoint = {
  date: string;
  negativeCount: number;
  reviewCount: number;
};

export type ReviewAnalyzerReport = {
  period: string;
  range: { start: string; end: string };
  summary: {
    totalReviews: number;
    negativeReviews: number;
    averageRating: number;
    analyzedCount: number;
    reviewsChangePercent: number | null;
  };
  topComplaints: ReviewComplaintRank[];
  trends: ReviewTrendPoint[];
  themeGroups: Array<{
    theme: string;
    label: string;
    count: number;
    reviews: Array<{
      id: string;
      rating: number;
      body: string;
      productName: string;
      createdAt: string;
    }>;
  }>;
  reportNarrative: string;
  lastAnalyzedAt: string | null;
};

const BATCH_SIZE = 40;

function averageRating(reviews: Array<{ rating: number }>): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Number((sum / reviews.length).toFixed(1));
}

function bucketDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function loadApprovedReviews(start: Date, end: Date) {
  return prisma.productReview.findMany({
    where: {
      status: ProductReviewStatus.APPROVED,
      createdAt: { gte: start, lte: end },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      body: true,
      themes: true,
      sentiment: true,
      analyzedAt: true,
      createdAt: true,
      product: { select: { name: true } },
    },
  });
}

export async function analyzeAndPersistReviews(
  start: Date,
  end: Date,
): Promise<number> {
  const pending = await prisma.productReview.findMany({
    where: {
      status: ProductReviewStatus.APPROVED,
      createdAt: { gte: start, lte: end },
      OR: [{ analyzedAt: null }, { themes: { isEmpty: true } }],
    },
    select: { id: true, rating: true, body: true },
    take: 200,
  });

  if (pending.length === 0) return 0;

  let analyzed = 0;

  for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
    const chunk = pending.slice(offset, offset + BATCH_SIZE);
    const classifications = await classifyReviewsBatch(chunk);

    await Promise.all(
      chunk.map(async (review) => {
        const result =
          classifications.get(review.id) ??
          classifyReviewWithRules(review);
        await prisma.productReview.update({
          where: { id: review.id },
          data: {
            themes: result.themes,
            sentiment: result.sentiment,
            analyzedAt: new Date(),
          },
        });
        analyzed += 1;
      }),
    );
  }

  return analyzed;
}

function buildThemeCounts(
  reviews: Array<{ themes: string[] }>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    const uniqueThemes = new Set(
      review.themes.length > 0 ? review.themes : ["other"],
    );
    for (const theme of uniqueThemes) {
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
  }
  return counts;
}

function buildReportNarrative(
  topComplaints: ReviewComplaintRank[],
  summary: ReviewAnalyzerReport["summary"],
): string {
  if (summary.totalReviews === 0) {
    return "No approved reviews in this period. Encourage customers to review delivered orders.";
  }

  const lead = topComplaints[0];
  if (!lead) {
    return `${summary.totalReviews} reviews with an average rating of ${summary.averageRating}/5.`;
  }

  const lines = [
    `Analyzed ${summary.totalReviews} reviews (avg ${summary.averageRating}/5).`,
    `Top complaint theme: ${lead.label} (${lead.count} mentions, ${lead.sharePercent}% of themed feedback).`,
  ];

  if (topComplaints[1]) {
    lines.push(
      `Also trending: ${topComplaints[1].label} (${topComplaints[1].count}), ${topComplaints[2]?.label ?? "fewer other themes"}.`,
    );
  }

  if (summary.negativeReviews > 0) {
    lines.push(
      `${summary.negativeReviews} reviews flagged as negative sentiment — prioritize fixes on ${lead.label.toLowerCase()}.`,
    );
  }

  return lines.join(" ");
}

export async function buildReviewAnalyzerReport(
  periodRaw: unknown,
): Promise<ReviewAnalyzerReport> {
  const period = parseAnalyticsPeriod(periodRaw);
  const { start, end, previousStart, previousEnd } =
    resolveAnalyticsDateRange(period);

  await analyzeAndPersistReviews(start, end);

  const [currentReviews, previousCount] = await Promise.all([
    loadApprovedReviews(start, end),
    prisma.productReview.count({
      where: {
        status: ProductReviewStatus.APPROVED,
        createdAt: { gte: previousStart, lte: previousEnd },
      },
    }),
  ]);

  const previousReviews =
    previousCount > 0
      ? await prisma.productReview.findMany({
          where: {
            status: ProductReviewStatus.APPROVED,
            createdAt: { gte: previousStart, lte: previousEnd },
          },
          select: { themes: true },
        })
      : [];

  const currentCounts = buildThemeCounts(currentReviews);
  const previousCounts = buildThemeCounts(previousReviews);
  const totalThemedMentions = Array.from(currentCounts.values()).reduce(
    (sum, count) => sum + count,
    0,
  );

  const topComplaints: ReviewComplaintRank[] = Array.from(currentCounts.entries())
    .map(([theme, count]) => {
      const previous = previousCounts.get(theme) ?? 0;
      const samples = currentReviews
        .filter((review) => review.themes.includes(theme))
        .slice(0, 3)
        .map((review) => review.body.trim());

      return {
        theme,
        label: themeLabelForSlug(theme),
        count,
        sharePercent:
          totalThemedMentions === 0
            ? 0
            : Number(((count / totalThemedMentions) * 100).toFixed(1)),
        changePercent:
          previous === 0 ? null : percentChange(count, previous),
        sampleQuotes: samples,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const trendMap = new Map<string, { negative: number; total: number }>();
  for (const review of currentReviews) {
    const key = bucketDate(review.createdAt);
    const bucket = trendMap.get(key) ?? { negative: 0, total: 0 };
    bucket.total += 1;
    if (review.sentiment === "negative" || review.rating <= 2) {
      bucket.negative += 1;
    }
    trendMap.set(key, bucket);
  }

  const trends: ReviewTrendPoint[] = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => ({
      date,
      negativeCount: bucket.negative,
      reviewCount: bucket.total,
    }));

  const themeGroups = topComplaints.slice(0, 5).map((complaint) => ({
    theme: complaint.theme,
    label: complaint.label,
    count: complaint.count,
    reviews: currentReviews
      .filter((review) => review.themes.includes(complaint.theme))
      .slice(0, 5)
      .map((review) => ({
        id: review.id,
        rating: review.rating,
        body: review.body,
        productName: review.product.name,
        createdAt: review.createdAt.toISOString(),
      })),
  }));

  const negativeReviews = currentReviews.filter(
    (review) => review.sentiment === "negative" || review.rating <= 2,
  ).length;

  const lastAnalyzed = currentReviews.reduce<Date | null>((latest, review) => {
    if (!review.analyzedAt) return latest;
    if (!latest || review.analyzedAt > latest) return review.analyzedAt;
    return latest;
  }, null);

  const summary = {
    totalReviews: currentReviews.length,
    negativeReviews,
    averageRating: averageRating(currentReviews),
    analyzedCount: currentReviews.filter((review) => review.analyzedAt).length,
    reviewsChangePercent:
      previousCount === 0
        ? null
        : percentChange(currentReviews.length, previousCount),
  };

  return {
    period,
    range: { start: start.toISOString(), end: end.toISOString() },
    summary,
    topComplaints,
    trends,
    themeGroups,
    reportNarrative: buildReportNarrative(topComplaints, summary),
    lastAnalyzedAt: lastAnalyzed?.toISOString() ?? null,
  };
}
