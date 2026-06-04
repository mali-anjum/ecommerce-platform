import { Coupon } from "@/components/storefront/checkout/types/Coupon";
import { API_ROUTES } from "@/lib/routes/api";
import axios from "axios";
import { create } from "zustand";
import { sentryTracker } from "@/lib/monitoring";


interface CouponStore {
  couponList: Coupon[];
  isLoading: boolean;
  error: string | null;
  fetchCoupons: () => Promise<void>;
  createCoupon: (
    coupon: Omit<Coupon, "id" | "usageCount">
  ) => Promise<Coupon | null>;
  deleteCoupon: (id: string) => Promise<boolean>;
}

export const useCouponStore = create<CouponStore>((set, get) => ({
  couponList: [],
  isLoading: false,
  error: null,
  fetchCoupons: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_ROUTES.COUPON}/fetch-all-coupons`,
        { withCredentials: true }
      );
      set({ couponList: response.data.couponList, isLoading: false });
    } catch (e) {
    sentryTracker(e, { source: "useCouponStore" });
      set({ isLoading: false, error: "Failed to fetch coupons" });
    }
  },
  createCoupon: async (coupon) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${API_ROUTES.COUPON}/create-coupon`,
        coupon,
        { withCredentials: true }
      );

      set({ isLoading: false });
      return response.data.coupon;
    } catch (e) {
    sentryTracker(e, { source: "useCouponStore" });
      set({ isLoading: false, error: "Failed to fetch coupons" });
      return null;
    }
  },
  deleteCoupon: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`${API_ROUTES.COUPON}/${id}`, {
        withCredentials: true,
      });
      set({ isLoading: false });
      return response.data.success;
    } catch (error) {
    sentryTracker(error, { source: "useCouponStore" });
      set({ isLoading: false, error: "Failed to fetch coupons" });
      return null;
    }
  },
}));
