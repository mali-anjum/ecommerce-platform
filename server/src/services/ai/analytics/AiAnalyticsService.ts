import { LeadSource } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import {
  parseAnalyticsPeriod,
  percentChange,
  resolveAnalyticsDateRange,
} from "../../analytics/period";
import { groupTopQueries } from "./AiAnalyticsUtils";
import { isProductSearchIntent } from "../chat/ChatResponse";

export type AiMetricsSummary = {
  chatUsageCount: number;
  chatUsageChangePercent: number;
  conversionRate: number;
  convertedChats: number;
  topIntents: Array<{ intent: string; count: number }>;
};

export async function fetchAiMetricsSummary(
  start: Date,
  end: Date,
  previousStart: Date,
  previousEnd: Date,
): Promise<AiMetricsSummary> {
  const [chatUsageCount, previousChatCount, convertedChats, intentGroups] =
    await Promise.all([
      prisma.aiConversationLog.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      prisma.aiConversationLog.count({
        where: { createdAt: { gte: previousStart, lte: previousEnd } },
      }),
      prisma.aiConversationLog.count({
        where: {
          createdAt: { gte: start, lte: end },
          convertedToOrder: true,
        },
      }),
      prisma.aiConversationLog.groupBy({
        by: ["intent"],
        where: { createdAt: { gte: start, lte: end } },
        _count: { intent: true },
        orderBy: { _count: { intent: "desc" } },
        take: 5,
      }),
    ]);

  return {
    chatUsageCount,
    chatUsageChangePercent: percentChange(chatUsageCount, previousChatCount),
    conversionRate:
      chatUsageCount === 0
        ? 0
        : Number(((convertedChats / chatUsageCount) * 100).toFixed(1)),
    convertedChats,
    topIntents: intentGroups.map((group) => ({
      intent: group.intent,
      count: group._count.intent,
    })),
  };
}

export type AiAnalyticsDashboard = {
  period: string;
  summary: {
    totalConversations: number;
    uniqueUsers: number;
    convertedConversations: number;
    conversionRate: number;
    leadsGenerated: number;
    conversationChangePercent: number;
    leadsChangePercent: number;
  };
  intentBreakdown: Array<{ intent: string; count: number }>;
  mostAskedQuestions: Array<{ query: string; count: number }>;
  topProductQueries: Array<{ query: string; count: number }>;
  recentConversations: Array<{
    id: string;
    userId: string | null;
    query: string;
    intent: string;
    convertedToOrder: boolean;
    createdAt: string;
  }>;
};

export async function fetchAiAnalyticsDashboard(
  periodRaw: unknown,
): Promise<AiAnalyticsDashboard> {
  const period = parseAnalyticsPeriod(periodRaw);
  const { start, end, previousStart, previousEnd } =
    resolveAnalyticsDateRange(period);

  const [
    currentLogs,
    previousLogCount,
    currentConvertedCount,
    currentLeads,
    previousLeads,
    intentGroups,
    recentConversations,
  ] = await Promise.all([
    prisma.aiConversationLog.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { query: true, intent: true, userId: true, convertedToOrder: true },
    }),
    prisma.aiConversationLog.count({
      where: { createdAt: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.aiConversationLog.count({
      where: {
        createdAt: { gte: start, lte: end },
        convertedToOrder: true,
      },
    }),
    prisma.lead.count({
      where: {
        source: LeadSource.AI,
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.lead.count({
      where: {
        source: LeadSource.AI,
        createdAt: { gte: previousStart, lte: previousEnd },
      },
    }),
    prisma.aiConversationLog.groupBy({
      by: ["intent"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { intent: true },
      orderBy: { _count: { intent: "desc" } },
    }),
    prisma.aiConversationLog.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        userId: true,
        query: true,
        intent: true,
        convertedToOrder: true,
        createdAt: true,
      },
    }),
  ]);

  const totalConversations = currentLogs.length;
  const uniqueUsers = new Set(
    currentLogs.map((log) => log.userId).filter(Boolean),
  ).size;

  const conversionRate =
    totalConversations === 0
      ? 0
      : Number(((currentConvertedCount / totalConversations) * 100).toFixed(1));

  const productQueries = currentLogs.filter((log) =>
    isProductSearchIntent(log.intent),
  );

  return {
    period,
    summary: {
      totalConversations,
      uniqueUsers,
      convertedConversations: currentConvertedCount,
      conversionRate,
      leadsGenerated: currentLeads,
      conversationChangePercent: percentChange(
        totalConversations,
        previousLogCount,
      ),
      leadsChangePercent: percentChange(currentLeads, previousLeads),
    },
    intentBreakdown: intentGroups.map((group) => ({
      intent: group.intent,
      count: group._count.intent,
    })),
    mostAskedQuestions: groupTopQueries(currentLogs),
    topProductQueries: groupTopQueries(productQueries),
    recentConversations: recentConversations.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}
