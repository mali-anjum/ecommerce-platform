import { API_ROUTES } from "@/lib/routes/api";
import axios from "axios";
import { create } from "zustand";
import type { ProductCategory } from "@/components/products/types/category";

interface CategoryState {
  categories: ProductCategory[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  pendingRequest: Promise<void> | null;
  fetchCategories: (force?: boolean) => Promise<void>;
}

const CATEGORY_CACHE_MS = 2 * 60 * 1000;

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  pendingRequest: null,

  fetchCategories: async (force = false) => {
    const { categories, lastFetchedAt, pendingRequest } = get();

    if (!force && categories.length > 0 && lastFetchedAt) {
      const isFresh = Date.now() - lastFetchedAt < CATEGORY_CACHE_MS;
      if (isFresh) return;
    }

    if (pendingRequest) {
      await pendingRequest;
      return;
    }

    const request = (async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get(`${API_ROUTES.PRODUCTS}/categories`, {
          withCredentials: true,
        });

        const payload = response.data?.data ?? response.data;
        const normalized = Array.isArray(payload) ? payload : [];

        set({
          categories: normalized,
          isLoading: false,
          error: null,
          lastFetchedAt: Date.now(),
        });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error?.response?.data?.message || "Failed to fetch categories",
        });
      } finally {
        set({ pendingRequest: null });
      }
    })();

    set({ pendingRequest: request });
    await request;
  },
}));
