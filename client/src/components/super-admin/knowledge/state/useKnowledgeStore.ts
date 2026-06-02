import {
  adminApi,
  AI_ADMIN_ROUTES,
  unwrapData,
} from "@/lib/api/adminApiClient";
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

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  policies: null,
  isLoading: false,
  error: null,

  fetchPolicies: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminApi.get(AI_ADMIN_ROUTES.policies);
      const data = unwrapData<{ policies: StorePolicies }>(response);
      set({ policies: data.policies, isLoading: false });
    } catch {
      set({ error: "Failed to load store policies", isLoading: false });
    }
  },

  savePolicies: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminApi.put(AI_ADMIN_ROUTES.policies, payload);
      const data = unwrapData<{ policies: StorePolicies }>(response);
      set({ policies: data.policies, isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to save policies", isLoading: false });
      return false;
    }
  },
}));
