import type { CartPricingTotals } from "@/components/storefront/cart/utils/cartTotals";

export interface CartSummaryProps {
  pricing: CartPricingTotals;
  selectedCount: number;
  totalCartCount: number;
  checkoutDisabled?: boolean;
  onCheckout: () => void;
  onContinueShopping: () => void;
}
