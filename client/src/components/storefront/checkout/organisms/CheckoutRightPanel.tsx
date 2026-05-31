import { OrderSummary } from "@/components/storefront/checkout/molecules/CheckoutOrderSummary";
import { CartItemWithProduct } from "@/types/cart/cartItemStore";
import type { Coupon } from "@/types/checkout/Coupon";

interface CheckoutRightPanelProps {
  cartItems: CartItemWithProduct[];
  subtotal: number;
  discountAmount: number;
  total: number;
  couponCode: string;
  appliedCoupon: Coupon | null;
  couponError: string;
  onCouponChange: (code: string) => void;
  onApplyCoupon: () => void;
  checkoutReady: boolean;
}

export const CheckoutRightPanel = ({
  cartItems,
  subtotal,
  discountAmount,
  total,
  couponCode,
  appliedCoupon,
  couponError,
  onCouponChange,
  onApplyCoupon,
  checkoutReady
}: CheckoutRightPanelProps) => {
  return (
    <OrderSummary
      cartItems={cartItems}
      subtotal={subtotal}
      discountAmount={discountAmount}
      total={total}
      couponCode={couponCode}
      appliedCoupon={appliedCoupon}
      couponError={couponError}
      onCouponChange={onCouponChange}
      onApplyCoupon={onApplyCoupon}
      isCheckoutReady={checkoutReady}
    />
  );
};