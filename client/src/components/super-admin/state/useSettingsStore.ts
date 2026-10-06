import { API_ROUTES } from "@/lib/routes/api";
import axios from "axios";
import { create } from "zustand";
import { sentryTracker } from "@/lib/monitoring";

interface FeatureBanner {
  id: string;
  imageUrl: string;
}

interface FeaturedProduct {
  id: string;
  name: string;
  price: string;
  images: string[];
}

interface SettingsState {
  banners: FeatureBanner[];
  featuredProducts: FeaturedProduct[];
  isLoading: boolean;
  error: string | null;
  fetchBanners: () => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  addBanners: (files: File[]) => Promise<boolean>;
  updateFeaturedProducts: (productIds: string[]) => Promise<boolean>;
}

/** Prefer the server's reason (e.g. rejected file type) over a generic message. */
function settingsErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  banners: [],
  featuredProducts: [],
  isLoading: false,
  error: null,
  fetchBanners: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_ROUTES.SETTINGS}/get-banners`, {
        withCredentials: true,
      });
      set({ banners: response.data.banners, isLoading: false });
    } catch (e) {
    sentryTracker(e, { source: "useSettingsStore" });
      console.error(e);
      set({ error: "Failed to fetch banners", isLoading: false });
    }
  },
  fetchFeaturedProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_ROUTES.SETTINGS}/fetch-feature-products`,
        {
          withCredentials: true,
        }
      );
      set({
        featuredProducts: response.data.featuredProducts,
        isLoading: false,
      });
    } catch (e) {
    sentryTracker(e, { source: "useSettingsStore" });
      console.error(e);
      set({ error: "Failed to fetch featured products", isLoading: false });
    }
  },
  addBanners: async (files: File[]) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      const response = await axios.post(
        `${API_ROUTES.SETTINGS}/banners`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      set({
        isLoading: false,
      });

      return Boolean(response.data.success);
    } catch (e) {
    sentryTracker(e, { source: "useSettingsStore" });
      console.error(e);
      set({ error: settingsErrorMessage(e, "Failed to upload banners"), isLoading: false });
      return false;
    }
  },
  updateFeaturedProducts: async (productIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${API_ROUTES.SETTINGS}/update-feature-products`,
        { productIds },
        {
          withCredentials: true,
        }
      );
      set({
        isLoading: false,
      });
      return Boolean(response.data.success);
    } catch (e) {
    sentryTracker(e, { source: "useSettingsStore" });
      console.error(e);
      set({ error: settingsErrorMessage(e, "Failed to update featured products"), isLoading: false });
      return false;
    }
  },
}));
