import type { CartPricingTotals } from "@/components/user/cart/cartTotals";

export interface CartSummaryProps {
  pricing: CartPricingTotals;
  selectedCount: number;
  totalCartCount: number;
  checkoutDisabled?: boolean;
  onCheckout: () => void;
  onContinueShopping: () => void;
}
