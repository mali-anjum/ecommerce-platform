import type { CartPricingTotals } from "@/utils/cartTotals";

export interface CartSummaryProps {
  pricing: CartPricingTotals;
  selectedCount: number;
  totalCartCount: number;
  checkoutDisabled?: boolean;
  onCheckout: () => void;
  onContinueShopping: () => void;
}
