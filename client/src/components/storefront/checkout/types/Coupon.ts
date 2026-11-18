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