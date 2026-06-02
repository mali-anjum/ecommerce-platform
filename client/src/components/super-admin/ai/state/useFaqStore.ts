import {
  adminApi,
  AI_ADMIN_ROUTES,
  unwrapData,
} from "@/lib/api/adminApiClient";
import { create } from "zustand";

export type FaqRecord = {
  id: string;
  question: string;
  answer: string;
  href: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type SaveFaqPayload = {
  id?: string;
  question: string;
  answer: string;
  href?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

interface FaqState {
  faqs: FaqRecord[];
  isLoading: boolean;
  error: string | null;
  fetchFaqs: () => Promise<void>;
  saveFaq: (payload: SaveFaqPayload) => Promise<boolean>;
  deleteFaq: (id: string) => Promise<boolean>;
}

export const useFaqStore = create<FaqState>((set, get) => ({
  faqs: [],
  isLoading: false,
  error: null,

  fetchFaqs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminApi.get(AI_ADMIN_ROUTES.faq);
      const data = unwrapData<{ faqs: FaqRecord[] }>(response);
      set({ faqs: data.faqs, isLoading: false });
    } catch {
      set({ error: "Failed to load FAQ items", isLoading: false });
    }
  },

  saveFaq: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      if (payload.id) {
        const { id, ...body } = payload;
        await adminApi.patch(`${AI_ADMIN_ROUTES.faq}/${id}`, body);
      } else {
        await adminApi.post(AI_ADMIN_ROUTES.faq, payload);
      }
      await get().fetchFaqs();
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to save FAQ", isLoading: false });
      return false;
    }
  },

  deleteFaq: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await adminApi.delete(`${AI_ADMIN_ROUTES.faq}/${id}`);
      await get().fetchFaqs();
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to delete FAQ", isLoading: false });
      return false;
    }
  },
}));
