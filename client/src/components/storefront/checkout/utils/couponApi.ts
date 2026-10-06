import axios from "axios";
import { API_ROUTES } from "@/lib/routes/api";
import type { AppliedCoupon } from "@/components/storefront/checkout/types/Coupon";

export type CouponValidationResult =
  | { coupon: AppliedCoupon; error: null }
  | { coupon: null; error: string };

type ValidateCouponResponse = {
  success: boolean;
  message?: string;
  coupon?: AppliedCoupon;
};

/** Asks the server whether a code is usable now (dates, usage limit, active flag). */
export async function validateCouponCode(code: string): Promise<CouponValidationResult> {
  const trimmed = code.trim();
  if (!trimmed) return { coupon: null, error: "Please enter a coupon code" };

  try {
    const { data } = await axios.post<ValidateCouponResponse>(
      `${API_ROUTES.COUPON}/validate`,
      { code: trimmed },
      { withCredentials: true }
    );
    if (data.success && data.coupon) {
      const { id, code: couponCode, discountPercent } = data.coupon;
      return { coupon: { id, code: couponCode, discountPercent }, error: null };
    }
    return { coupon: null, error: data.message ?? "Invalid coupon code" };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response?.data as ValidateCouponResponse | undefined)?.message;
      if (error.response?.status === 401) {
        return { coupon: null, error: "Please sign in to apply a coupon" };
      }
      if (message) return { coupon: null, error: message };
    }
    return { coupon: null, error: "Could not check this coupon. Please try again." };
  }
}
