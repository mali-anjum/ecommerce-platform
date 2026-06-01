import { API_ROUTES } from "@/lib/routes/api";
import axios from "axios";
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

const authConfig = { withCredentials: true as const };

function unwrapData<T>(response: { data: { data?: T } }): T {
  return response.data.data as T;
}

export const useFaqStore = create<FaqState>((set, get) => ({
  faqs: [],
  isLoading: false,
  error: null,

  fetchFaqs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_ROUTES.AI}/admin/faq`, authConfig);
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
        await axios.patch(`${API_ROUTES.AI}/admin/faq/${id}`, body, authConfig);
      } else {
        await axios.post(`${API_ROUTES.AI}/admin/faq`, payload, authConfig);
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
      await axios.delete(`${API_ROUTES.AI}/admin/faq/${id}`, authConfig);
      await get().fetchFaqs();
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to delete FAQ", isLoading: false });
      return false;
    }
  },
}));
