import type { LeadCounts, LeadRecord } from "@/lib/assistant/types";
import {
  adminApi,
  LEADS_ROUTE,
  unwrapData,
} from "@/lib/api/adminApiClient";
import { create } from "zustand";

export type LeadSourceFilter = "all" | "AI" | "MANUAL";

interface LeadsState {
  leads: LeadRecord[];
  counts: LeadCounts;
  isLoading: boolean;
  error: string | null;
  fetchLeads: (source?: LeadSourceFilter) => Promise<void>;
  createLead: (payload: {
    email: string;
    phone?: string | null;
    message: string;
    source?: "AI" | "MANUAL";
  }) => Promise<boolean>;
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  counts: { ai: 0, manual: 0, total: 0 },
  isLoading: false,
  error: null,

  fetchLeads: async (source = "all") => {
    set({ isLoading: true, error: null });
    try {
      const query = source === "all" ? "" : `?source=${source}`;
      const response = await adminApi.get(`${LEADS_ROUTE}${query}`);
      const data = unwrapData<{ leads: LeadRecord[]; counts: LeadCounts }>(
        response,
      );
      set({
        leads: data.leads,
        counts: data.counts,
        isLoading: false,
      });
    } catch {
      set({ error: "Failed to load leads", isLoading: false });
    }
  },

  createLead: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await adminApi.post(LEADS_ROUTE, payload);
      await get().fetchLeads("all");
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to create lead", isLoading: false });
      return false;
    }
  },
}));
