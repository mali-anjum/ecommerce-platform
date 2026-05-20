export const CART_TAX_RATE = 0.0889;
export const CART_VOLUME_DISCOUNT_THRESHOLD = 100;
export const CART_FREE_SHIPPING_THRESHOLD = 100;
export const CART_SHIPPING_FEE = 9.99;
export const CART_VOLUME_DISCOUNT_RATE = 0.1;

export type CartPricingLine = {
  price: number;
  quantity: number;
};

export type CartPricingTotals = {
  subtotal: number;
  volumeDiscount: number;
  couponDiscount: number;
  discountedSubtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
};

export function calculateCartPricingTotals(
  lines: CartPricingLine[],
  couponDiscountPercent = 0
): CartPricingTotals {
  const subtotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0
  );
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const volumeDiscount =
    subtotal >= CART_VOLUME_DISCOUNT_THRESHOLD
      ? subtotal * CART_VOLUME_DISCOUNT_RATE
      : 0;

  const afterVolume = subtotal - volumeDiscount;
  const couponDiscount =
    couponDiscountPercent > 0
      ? (afterVolume * couponDiscountPercent) / 100
      : 0;

  const discountedSubtotal = Math.max(0, afterVolume - couponDiscount);
  const shipping =
    subtotal >= CART_FREE_SHIPPING_THRESHOLD ? 0 : CART_SHIPPING_FEE;
  const tax = discountedSubtotal * CART_TAX_RATE;
  const total = discountedSubtotal + shipping + tax;

  return {
    subtotal,
    volumeDiscount,
    couponDiscount,
    discountedSubtotal,
    shipping,
    tax,
    total: Math.max(0, total),
    itemCount,
  };
}
