"use client";

import { KPIGrid } from "@/components/super-admin/analytics/molecules/KpiGrid";
import { StatsGrid } from "@/components/super-admin/analytics/molecules/StatsGrid";
import { AIKPIGrid } from "@/components/super-admin/analytics/molecules/AIKPIGrid";

interface AnalyticsKPISectionProps {
  data: {
    kpis: any;
    aiMetrics: any;
  };
}

export function AnalyticsKPISection({ data }: AnalyticsKPISectionProps) {
  return (
    <div className="space-y-6">
      <KPIGrid data={data} />
      <StatsGrid data={data} />
      <AIKPIGrid data={data} />
    </div>
  );
}