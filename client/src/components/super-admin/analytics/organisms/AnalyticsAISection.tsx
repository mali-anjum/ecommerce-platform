"use client";

import { AiMetricsPanel, FunnelTrackingPanel } from "../molecules/AnalyticsCharts";

interface AnalyticsAISectionProps {
  data: {
    aiMetrics: any;
    funnelTracking: any;
  };
}

export function AnalyticsAISection({ data }: AnalyticsAISectionProps) {
  return (
    <div className="space-y-6">
      <AiMetricsPanel metrics={data.aiMetrics} />
      <FunnelTrackingPanel funnel={data.funnelTracking} />
    </div>
  );
}