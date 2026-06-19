"use client";

import { KpiCard } from "../atoms/KpiCard";
import { formatNumber } from "../utils/formatters";
import { Bot, MessageSquare, Percent } from "lucide-react";

interface AIKPIGridProps {
  data: {
    aiMetrics: {
      chatUsageCount: number;
      chatUsageChangePercent: number;
      conversionRate: number;
      convertedChats: number;
      topIntents: Array<{
        intent: string;
        count: number;
      }>;
    };
  };
}

export function AIKPIGrid({ data }: AIKPIGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <KpiCard
        title="AI chat usage"
        value={formatNumber(data.aiMetrics.chatUsageCount)}
        changePercent={data.aiMetrics.chatUsageChangePercent}
        icon={MessageSquare}
        accent="primary"
      />
      <KpiCard
        title="AI conversion rate"
        value={`${data.aiMetrics.conversionRate}%`}
        hint={`${data.aiMetrics.convertedChats} chats converted to orders`}
        icon={Percent}
        accent="success"
      />
      <KpiCard
        title="Top AI intent"
        value={
          data.aiMetrics.topIntents[0]
            ? data.aiMetrics.topIntents[0].intent
                .split("_")
                .map(
                  (part) =>
                    part.charAt(0).toUpperCase() + part.slice(1),
                )
                .join(" ")
            : "—"
        }
        hint={
          data.aiMetrics.topIntents[0]
            ? `${data.aiMetrics.topIntents[0].count} conversations`
            : "No AI data yet"
        }
        icon={Bot}
        accent="accent"
      />
    </div>
  );
}