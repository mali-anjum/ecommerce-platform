// src/utils/coupon/couponHelpers.ts
export const getDiscountStrength = (percentage: number): number => {
  return Math.min(Math.floor(percentage / 20), 5);
};

export const getDiscountImpact = (percentage: number): 'High' | 'Medium' | 'Low' => {
  if (percentage > 30) return 'High';
  if (percentage > 15) return 'Medium';
  return 'Low';
};

export const formatCouponCode = (code: string): string => {
  return code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
};