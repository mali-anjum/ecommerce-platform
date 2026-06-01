import { API_ROUTES } from "@/lib/routes/api";
import axios from "axios";
import { create } from "zustand";

export type StorePolicies = {
  id: string;
  returnPolicy: string;
  shippingPolicy: string;
  shipsInternationally: boolean;
  internationalShippingDetails: string;
  supportEmail: string | null;
};

interface KnowledgeState {
  policies: StorePolicies | null;
  isLoading: boolean;
  error: string | null;
  fetchPolicies: () => Promise<void>;
  savePolicies: (payload: Partial<StorePolicies>) => Promise<boolean>;
}

const authConfig = { withCredentials: true as const };

function unwrapData<T>(response: { data: { data?: T } }): T {
  return response.data.data as T;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  policies: null,
  isLoading: false,
  error: null,

  fetchPolicies: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_ROUTES.AI}/policies`, authConfig);
      const data = unwrapData<{ policies: StorePolicies }>(response);
      set({ policies: data.policies, isLoading: false });
    } catch {
      set({ error: "Failed to load store policies", isLoading: false });
    }
  },

  savePolicies: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(
        `${API_ROUTES.AI}/admin/policies`,
        payload,
        authConfig,
      );
      const data = unwrapData<{ policies: StorePolicies }>(response);
      set({ policies: data.policies, isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to save policies", isLoading: false });
      return false;
    }
  },
}));
