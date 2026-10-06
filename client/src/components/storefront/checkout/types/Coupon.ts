// types/checkout/Coupon.ts
export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  // Add these missing properties
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  maxDiscount?: number;
  minOrderValue?: number;
}

/** What checkout keeps after the server accepts a code (`POST /coupon/validate`). */
export type AppliedCoupon = Pick<Coupon, "id" | "code" | "discountPercent">;