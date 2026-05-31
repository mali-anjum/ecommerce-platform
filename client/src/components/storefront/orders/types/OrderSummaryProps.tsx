import type { Coupon } from "@/components/storefront/checkout/types/Coupon";

export interface OrderSummaryProps {
  cartItems: any[];
  subtotal: number;
  discountAmount: number;
  total: number;
  couponCode: string;
  appliedCoupon: Coupon | null;
  couponError: string;
  onCouponChange: (code: string) => void;
  onApplyCoupon: () => void;
}