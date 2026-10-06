import { CartItemWithProduct } from '@/components/storefront/cart/types/cartItemStore';
import type { AppliedCoupon } from '@/components/storefront/checkout/types/Coupon';
import { calculateCartPricingTotals } from '@/components/storefront/cart/utils/cartTotals';

export const calculateTotals = (
  cartItems: CartItemWithProduct[],
  appliedCoupon: AppliedCoupon | null
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