import {
  SalesEmailJobStatus,
  SalesOfferStatus,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import {
  parseAnalyticsPeriod,
  percentChange,
  resolveAnalyticsDateRange,
} from "../../analytics/period";
import { fetchSegmentBreakdown } from "./CustomerProfileService";
import { formatSegmentLabel } from "./SalesDecisionService";

export type SalesAgentAdminDashboard = {
  period: string;
  summary: {
    offersGenerated: number;
    offersShown: number;
    offersConverted: number;
    emailsQueued: number;
    emailsSent: number;
    emailsFailed: number;
    avgIntentScore: number;
    offerConversionRate: number;
    offersChangePercent: number;
  };
  segmentBreakdown: Array<{ segment: string; label: string; count: number }>;
  triggerBreakdown: Array<{ trigger: string; count: number }>;
  scoreDistribution: Array<{ bucket: string; count: number }>;
  recentOffers: Array<{
    id: string;
    intentScore: number;
    segment: string;
    intentSummary: string;
    triggerReason: string;
    status: string;
    email: string | null;
    couponCode: string | null;
    createdAt: string;
  }>;
  recentEmailJobs: Array<{
    id: string;
    toEmail: string;
    jobType: string;
    status: string;
    scheduledAt: string;
    sentAt: string | null;
    attempts: number;
  }>;
};

function scoreBucket(score: number): string {
  if (score >= 80) return "80-100";
  if (score >= 60) return "60-79";
  if (score >= 40) return "40-59";
  return "0-39";
}

export async function fetchSalesAgentAdminDashboard(
  periodRaw: unknown,
): Promise<SalesAgentAdminDashboard> {
  const period = parseAnalyticsPeriod(periodRaw);
  const { start, end, previousStart, previousEnd } =
    resolveAnalyticsDateRange(period);

  const [
    offers,
    previousOfferCount,
    emailsQueued,
    emailsSent,
    emailsFailed,
    segmentBreakdown,
    recentEmailJobs,
  ] = await Promise.all([
    prisma.salesAgentOffer.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        intentScore: true,
        segment: true,
        intentSummary: true,
        triggerReason: true,
        status: true,
        email: true,
        couponCode: true,
        createdAt: true,
      },
    }),
    prisma.salesAgentOffer.count({
      where: { createdAt: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.salesEmailJob.count({
      where: { createdAt: { gte: start, lte: end } },
    }),
    prisma.salesEmailJob.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: SalesEmailJobStatus.SENT,
      },
    }),
    prisma.salesEmailJob.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: SalesEmailJobStatus.FAILED,
      },
    }),
    fetchSegmentBreakdown(start, end),
    prisma.salesEmailJob.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { scheduledAt: "desc" },
      take: 25,
      select: {
        id: true,
        toEmail: true,
        jobType: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        attempts: true,
      },
    }),
  ]);

  const offersGenerated = offers.length;
  const offersShown = offers.filter(
    (offer) =>
      offer.status === SalesOfferStatus.SHOWN ||
      offer.status === SalesOfferStatus.CONVERTED,
  ).length;
  const offersConverted = offers.filter(
    (offer) => offer.status === SalesOfferStatus.CONVERTED,
  ).length;
  const avgIntentScore =
    offersGenerated === 0
      ? 0
      : Math.round(
          offers.reduce((sum, offer) => sum + offer.intentScore, 0) /
            offersGenerated,
        );

  const triggerMap = new Map<string, number>();
  const scoreMap = new Map<string, number>();
  for (const offer of offers) {
    triggerMap.set(
      offer.triggerReason,
      (triggerMap.get(offer.triggerReason) ?? 0) + 1,
    );
    const bucket = scoreBucket(offer.intentScore);
    scoreMap.set(bucket, (scoreMap.get(bucket) ?? 0) + 1);
  }

  return {
    period,
    summary: {
      offersGenerated,
      offersShown,
      offersConverted,
      emailsQueued,
      emailsSent,
      emailsFailed,
      avgIntentScore,
      offerConversionRate:
        offersShown === 0
          ? 0
          : Number(((offersConverted / offersShown) * 100).toFixed(1)),
      offersChangePercent: percentChange(offersGenerated, previousOfferCount),
    },
    segmentBreakdown: segmentBreakdown.map((row) => ({
      segment: row.segment,
      label: formatSegmentLabel(row.segment),
      count: row.count,
    })),
    triggerBreakdown: [...triggerMap.entries()].map(([trigger, count]) => ({
      trigger,
      count,
    })),
    scoreDistribution: [...scoreMap.entries()].map(([bucket, count]) => ({
      bucket,
      count,
    })),
    recentOffers: offers.slice(0, 25).map((offer) => ({
      ...offer,
      segment: offer.segment,
      createdAt: offer.createdAt.toISOString(),
    })),
    recentEmailJobs: recentEmailJobs.map((job) => ({
      ...job,
      scheduledAt: job.scheduledAt.toISOString(),
      sentAt: job.sentAt?.toISOString() ?? null,
    })),
  };
}

export async function listSalesAgentOffers(limit = 50) {
  return prisma.salesAgentOffer.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listSalesEmailJobs(limit = 50) {
  return prisma.salesEmailJob.findMany({
    orderBy: { scheduledAt: "desc" },
    take: limit,
  });
}
