import {
  calculateCartPricingTotals,
  CART_SHIPPING_FEE,
} from "../../components/user/cart/cartTotals";

describe("calculateCartPricingTotals", () => {
  it("calculates shipping and tax for small orders", () => {
    const result = calculateCartPricingTotals([{ price: 25, quantity: 2 }]);

    expect(result.subtotal).toBe(50);
    expect(result.shipping).toBe(CART_SHIPPING_FEE);
    expect(result.total).toBeCloseTo(50 + CART_SHIPPING_FEE + 50 * 0.0889, 5);
  });

  it("waives shipping and applies volume discount for large orders", () => {
    const result = calculateCartPricingTotals([{ price: 120, quantity: 1 }]);

    expect(result.volumeDiscount).toBe(12);
    expect(result.shipping).toBe(0);
  });
});
