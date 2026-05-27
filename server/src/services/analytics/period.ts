import type { AnalyticsDateRange, AnalyticsPeriod } from "./types";

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

export function parseAnalyticsPeriod(raw: unknown): AnalyticsPeriod {
  const value = String(raw ?? "30d").trim() as AnalyticsPeriod;
  if (value in PERIOD_DAYS) {
    return value;
  }
  return "30d";
}

export function resolveAnalyticsDateRange(period: AnalyticsPeriod): AnalyticsDateRange {
  const days = PERIOD_DAYS[period];
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const previousEnd = new Date(start);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days);
  previousStart.setHours(0, 0, 0, 0);

  return { period, start, end, previousStart, previousEnd };
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
