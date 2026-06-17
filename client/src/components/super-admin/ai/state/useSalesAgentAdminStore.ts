import {
  adminApi,
  AI_ADMIN_ROUTES,
  unwrapData,
} from "@/lib/api/adminApiClient";
import type { SalesAgentAdminDashboard } from "@/lib/sales-agent/types";
import { create } from "zustand";

export type SalesAgentPeriod = "7d" | "30d" | "90d";

interface SalesAgentAdminState {
  period: SalesAgentPeriod;
  dashboard: SalesAgentAdminDashboard | null;
  isLoading: boolean;
  error: string | null;
  setPeriod: (period: SalesAgentPeriod) => void;
  fetchDashboard: (period?: SalesAgentPeriod) => Promise<void>;
}

export const useSalesAgentAdminStore = create<SalesAgentAdminState>((set, get) => ({
  period: "7d",
  dashboard: null,
  isLoading: false,
  error: null,
  setPeriod: (period) => set({ period }),
  fetchDashboard: async (period) => {
    const resolved = period ?? get().period;
    set({ isLoading: true, error: null });
    try {
      const response = await adminApi.get(
        `${AI_ADMIN_ROUTES.salesAgent}?period=${resolved}`,
      );
      const dashboard = unwrapData<SalesAgentAdminDashboard>(response);
      set({ dashboard, isLoading: false });
    } catch {
      set({
        error: "Failed to load sales agent dashboard",
        isLoading: false,
      });
    }
  },
}));
