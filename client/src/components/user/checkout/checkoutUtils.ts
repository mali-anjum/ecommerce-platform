import { CartItemWithProduct } from '@/types/cart/cartItemStore';
import type { Coupon } from '@/types/checkout';
import { calculateCartPricingTotals } from '@/components/user/cart/cartTotals';

export const calculateTotals = (
  cartItems: CartItemWithProduct[],
  appliedCoupon: Coupon | null
) => {
  const pricing = calculateCartPricingTotals(
    cartItems.map((item) => ({
      price: item.product?.price || 0,
      quantity: item.quantity,
    })),
    appliedCoupon?.discountPercent ?? 0
  );

  return {
    subtotal: pricing.subtotal,
    discountAmount: pricing.volumeDiscount + pricing.couponDiscount,
    volumeDiscount: pricing.volumeDiscount,
    couponDiscount: pricing.couponDiscount,
    shipping: pricing.shipping,
    tax: pricing.tax,
    total: pricing.total,
  };
};

export const isCheckoutReady = (
  selectedAddress: string,
  cartItems: CartItemWithProduct[]
): boolean => {
  return Boolean(selectedAddress && cartItems.length > 0);
};