import {
  adminApi,
  AI_ADMIN_ROUTES,
  unwrapData,
} from "@/lib/api/adminApiClient";
import type {
  ReviewAnalyzerDashboard,
  ReviewAnalyzerPeriod,
} from "@/lib/review-analyzer/types";
import { create } from "zustand";

interface ReviewAnalyzerState {
  period: ReviewAnalyzerPeriod;
  dashboard: ReviewAnalyzerDashboard | null;
  isLoading: boolean;
  error: string | null;
  setPeriod: (period: ReviewAnalyzerPeriod) => void;
  fetchDashboard: (period?: ReviewAnalyzerPeriod) => Promise<void>;
  refreshAnalysis: () => Promise<void>;
}

export const useReviewAnalyzerStore = create<ReviewAnalyzerState>((set, get) => ({
  period: "30d",
  dashboard: null,
  isLoading: false,
  error: null,
  setPeriod: (period) => set({ period }),
  fetchDashboard: async (period) => {
    const resolved = period ?? get().period;
    set({ isLoading: true, error: null });
    try {
      const response = await adminApi.get(
        `${AI_ADMIN_ROUTES.reviewAnalyzer}?period=${resolved}`,
      );
      const dashboard = unwrapData<ReviewAnalyzerDashboard>(response);
      set({ dashboard, isLoading: false });
    } catch {
      set({
        error: "Failed to load review analyzer",
        isLoading: false,
      });
    }
  },
  refreshAnalysis: async () => {
    const period = get().period;
    set({ isLoading: true, error: null });
    try {
      const response = await adminApi.post(
        `${AI_ADMIN_ROUTES.reviewAnalyzer}/refresh?period=${period}`,
      );
      const dashboard = unwrapData<ReviewAnalyzerDashboard>(response);
      set({ dashboard, isLoading: false });
    } catch {
      set({
        error: "Failed to refresh review analysis",
        isLoading: false,
      });
    }
  },
}));
