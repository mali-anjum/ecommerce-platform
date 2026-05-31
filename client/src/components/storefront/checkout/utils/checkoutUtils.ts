import { CartItemWithProduct } from '@/components/storefront/cart/types/cartItemStore';
import type { Coupon } from '@/components/storefront/checkout/types';
import { calculateCartPricingTotals } from '@/components/storefront/cart/utils/cartTotals';

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