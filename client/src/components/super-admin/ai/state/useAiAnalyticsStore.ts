import {
  adminApi,
  AI_ADMIN_ROUTES,
  unwrapData,
} from "@/lib/api/adminApiClient";
import { create } from "zustand";

export type AiAnalyticsPeriod = "7d" | "30d" | "90d";

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

interface AiAnalyticsState {
  period: AiAnalyticsPeriod;
  dashboard: AiAnalyticsDashboard | null;
  isLoading: boolean;
  error: string | null;
  setPeriod: (period: AiAnalyticsPeriod) => void;
  fetchDashboard: (period?: AiAnalyticsPeriod) => Promise<void>;
}

export const useAiAnalyticsStore = create<AiAnalyticsState>((set, get) => ({
  period: "30d",
  dashboard: null,
  isLoading: false,
  error: null,

  setPeriod: (period) => set({ period }),

  fetchDashboard: async (period = get().period) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminApi.get(
        `${AI_ADMIN_ROUTES.analytics}?period=${period}`,
      );
      const dashboard = unwrapData<AiAnalyticsDashboard>(response);
      set({ dashboard, period, isLoading: false });
    } catch {
      set({ error: "Failed to load AI analytics", isLoading: false });
    }
  },
}));
