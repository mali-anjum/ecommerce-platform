"use client";

import { Button } from "@/components/ui/button";
import { useAnalyticsStore } from "@/components/super-admin/analytics/state/useAnalyticsStore";
import type { AnalyticsDashboard, AnalyticsPeriod } from "@/components/super-admin/analytics/types/analytics";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { AnalyticsShell } from "../molecules/AnalyticsShell";

interface AnalyticsPageBaseProps {
  title: string;
  subtitle: string;
  render: (data: AnalyticsDashboard) => React.ReactNode;
}

export function AnalyticsPageBase({
  title,
  subtitle,
  render,
}: AnalyticsPageBaseProps) {
  const period = useAnalyticsStore((s) => s.period);
  const dashboard = useAnalyticsStore((s) => s.dashboard);
  const isLoading = useAnalyticsStore((s) => s.isLoading);
  const error = useAnalyticsStore((s) => s.error);
  const setPeriod = useAnalyticsStore((s) => s.setPeriod);
  const fetchDashboard = useAnalyticsStore((s) => s.fetchDashboard);
  const refreshDashboard = useAnalyticsStore((s) => s.refreshDashboard);

  useEffect(() => {
    void fetchDashboard(period);
  }, [fetchDashboard, period]);

  const handlePeriodChange = (next: AnalyticsPeriod) => {
    setPeriod(next);
  };

  return (
    <AnalyticsShell
      title={title}
      subtitle={subtitle}
      period={period}
      onPeriodChange={handlePeriodChange}
      onRefresh={() => void refreshDashboard()}
      loading={isLoading}
      generatedAt={dashboard?.generatedAt}
    >
      {error && (
        <div className="glass-effect border border-destructive/30 rounded-xl p-4 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1 text-sm">{error}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshDashboard()}
          >
            Retry
          </Button>
        </div>
      )}

      {isLoading && !dashboard && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-glass-border bg-card/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {dashboard && render(dashboard)}
    </AnalyticsShell>
  );
}
