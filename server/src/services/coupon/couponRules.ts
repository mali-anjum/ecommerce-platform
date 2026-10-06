import type { Coupon } from "@prisma/client";

export type CouponRuleInput = Pick<
  Coupon,
  "isActive" | "startDate" | "endDate" | "usageLimit" | "usageCount" | "minOrderValue"
>;

/**
 * Returns why a coupon cannot be used right now, or null when it is valid.
 * Pass `subtotal` once the order amount is known to enforce `minOrderValue`.
 */
export function getCouponRejection(
  coupon: CouponRuleInput,
  now: Date = new Date(),
  subtotal?: number
): string | null {
  if (!coupon.isActive) return "Coupon is not active";
  if (now < coupon.startDate) return "Coupon is not valid yet";
  if (now > coupon.endDate) return "Coupon has expired";
  if (coupon.usageCount >= coupon.usageLimit) return "Coupon has reached its usage limit";
  if (
    subtotal !== undefined &&
    coupon.minOrderValue !== null &&
    subtotal < coupon.minOrderValue
  ) {
    return `Order must be at least ${coupon.minOrderValue.toFixed(2)} to use this coupon`;
  }
  return null;
}
