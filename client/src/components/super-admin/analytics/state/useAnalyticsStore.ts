import type { AnalyticsDashboard, AnalyticsPeriod } from "@/components/super-admin/analytics/types/analytics";
import type {
  AnalyticsStore,
  FetchDashboardOptions,
} from "@/components/super-admin/analytics/types/analyticsStoreTypes";
import { ApiResult } from "@/components/storefront/orders/types/orderTypes";
import { http } from "@/lib/http";
import { AxiosError } from "axios";
import { create } from "zustand";

type ApiErrorPayload = { message?: string; error?: string };

/** Reuse cached dashboard for this long when navigating between analytics tabs. */
const CACHE_TTL_MS = 60_000;

const initialState = {
  period: "30d" as AnalyticsPeriod,
  dashboard: null as AnalyticsDashboard | null,
  dashboardByPeriod: {} as Partial<Record<AnalyticsPeriod, AnalyticsDashboard>>,
  fetchedAtByPeriod: {} as Partial<Record<AnalyticsPeriod, number>>,
  isLoading: false,
  error: null as string | null,
};

function getAxiosErrorMessage(error: unknown, fallback: string): string {
  const ax = error as AxiosError<ApiErrorPayload>;
  return ax.response?.data?.message ?? ax.response?.data?.error ?? fallback;
}

function isCacheFresh(
  period: AnalyticsPeriod,
  fetchedAtByPeriod: Partial<Record<AnalyticsPeriod, number>>,
): boolean {
  const fetchedAt = fetchedAtByPeriod[period];
  if (!fetchedAt) return false;
  return Date.now() - fetchedAt < CACHE_TTL_MS;
}

const inflightByPeriod = new Map<
  AnalyticsPeriod,
  Promise<AnalyticsDashboard | null>
>();

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  ...initialState,

  setPeriod: (period) => {
    const cached = get().dashboardByPeriod[period] ?? null;
    set({
      period,
      dashboard: cached,
      error: null,
    });
  },

  fetchDashboard: async (periodArg, options) => {
    const period = periodArg ?? get().period;
    const force = options?.force ?? false;
    const state = get();
    const cached = state.dashboardByPeriod[period];

    if (!force && cached && isCacheFresh(period, state.fetchedAtByPeriod)) {
      set({
        period,
        dashboard: cached,
        isLoading: false,
        error: null,
      });
      return cached;
    }

    const existing = inflightByPeriod.get(period);
    if (existing) {
      return existing;
    }

    set({ period, isLoading: true, error: null });

    const request = (async (): Promise<AnalyticsDashboard | null> => {
      try {
        const { data } = await http.get<ApiResult<AnalyticsDashboard>>(
          "analytics/dashboard",
          {
            params: { period },
            withCredentials: true,
          },
        );

        const payload = data.data;
        if (!data.success || !payload) {
          throw new Error(
            data.message ?? data.error ?? "Failed to load analytics",
          );
        }

        set((current) => ({
          isLoading: false,
          error: null,
          dashboard: current.period === period ? payload : current.dashboard,
          dashboardByPeriod: {
            ...current.dashboardByPeriod,
            [period]: payload,
          },
          fetchedAtByPeriod: {
            ...current.fetchedAtByPeriod,
            [period]: Date.now(),
          },
        }));

        return payload;
      } catch (error: unknown) {
        set((current) => ({
          isLoading: false,
          error: getAxiosErrorMessage(error, "Failed to load analytics"),
          dashboard: current.period === period ? null : current.dashboard,
        }));
        return null;
      } finally {
        inflightByPeriod.delete(period);
      }
    })();

    inflightByPeriod.set(period, request);
    return request;
  },

  refreshDashboard: () => {
    const { period } = get();
    return get().fetchDashboard(period, { force: true });
  },

  reset: () => {
    inflightByPeriod.clear();
    set({ ...initialState });
  },
}));
