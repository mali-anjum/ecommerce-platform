export const CHECKOUT_TAX_RATE = 0.0889;
export const CHECKOUT_VOLUME_DISCOUNT_THRESHOLD = 100;
export const CHECKOUT_FREE_SHIPPING_THRESHOLD = 100;
export const CHECKOUT_SHIPPING_FEE = 9.99;
export const CHECKOUT_VOLUME_DISCOUNT_RATE = 0.1;

export type CheckoutTotals = {
  subtotal: number;
  volumeDiscount: number;
  couponDiscount: number;
  discountedSubtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

export function calculateCheckoutTotals(
  subtotal: number,
  couponDiscountPercent = 0
): CheckoutTotals {
  const volumeDiscount =
    subtotal >= CHECKOUT_VOLUME_DISCOUNT_THRESHOLD
      ? subtotal * CHECKOUT_VOLUME_DISCOUNT_RATE
      : 0;

  const afterVolume = subtotal - volumeDiscount;
  const couponDiscount =
    couponDiscountPercent > 0
      ? (afterVolume * couponDiscountPercent) / 100
      : 0;

  const discountedSubtotal = Math.max(0, afterVolume - couponDiscount);
  const shipping =
    subtotal >= CHECKOUT_FREE_SHIPPING_THRESHOLD ? 0 : CHECKOUT_SHIPPING_FEE;
  const tax = discountedSubtotal * CHECKOUT_TAX_RATE;
  const total = discountedSubtotal + shipping + tax;

  return {
    subtotal,
    volumeDiscount,
    couponDiscount,
    discountedSubtotal,
    shipping,
    tax,
    total: Math.max(0, total),
  };
}
