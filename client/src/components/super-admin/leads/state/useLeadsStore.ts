import { API_ROUTES } from "@/lib/routes/api";
import type { LeadCounts, LeadRecord } from "@/lib/assistant/types";
import axios from "axios";
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

const authConfig = { withCredentials: true as const };

function unwrapData<T>(response: { data: { data?: T } }): T {
  return response.data.data as T;
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
      const response = await axios.get(`${API_ROUTES.LEADS}${query}`, authConfig);
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
      await axios.post(API_ROUTES.LEADS, payload, authConfig);
      await get().fetchLeads("all");
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to create lead", isLoading: false });
      return false;
    }
  },
}));
