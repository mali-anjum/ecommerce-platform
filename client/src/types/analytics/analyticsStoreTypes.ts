import type { AnalyticsDashboard, AnalyticsPeriod } from "@/types/analytics";

export interface FetchDashboardOptions {
  /** Bypass in-memory cache and refetch from API. */
  force?: boolean;
}

export interface AnalyticsStore {
  period: AnalyticsPeriod;
  dashboard: AnalyticsDashboard | null;
  dashboardByPeriod: Partial<Record<AnalyticsPeriod, AnalyticsDashboard>>;
  fetchedAtByPeriod: Partial<Record<AnalyticsPeriod, number>>;
  isLoading: boolean;
  error: string | null;
  setPeriod: (period: AnalyticsPeriod) => void;
  fetchDashboard: (
    period?: AnalyticsPeriod,
    options?: FetchDashboardOptions,
  ) => Promise<AnalyticsDashboard | null>;
  refreshDashboard: () => Promise<AnalyticsDashboard | null>;
  reset: () => void;
}
