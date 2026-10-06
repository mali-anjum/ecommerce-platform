import { calculateTotals, isCheckoutReady } from "../checkoutUtils";
import type { CartItemWithProduct } from "@/components/storefront/cart/types/cartItemStore";

const line = (price: number, quantity: number): CartItemWithProduct => ({
  id: `l-${price}`,
  productId: "p",
  quantity,
  size: "",
  color: "",
  product: { id: "p", name: "P", price, category: "C", images: [] },
});

describe("calculateTotals", () => {
  it("adds shipping and tax below the free-shipping threshold", () => {
    const totals = calculateTotals([line(40, 2)], null);
    expect(totals.subtotal).toBe(80);
    expect(totals.couponDiscount).toBe(0);
    expect(totals.shipping).toBeCloseTo(9.99);
    expect(totals.total).toBeCloseTo(80 + 9.99 + 80 * 0.0889, 6);
  });

  it("applies the coupon percentage after the volume discount", () => {
    const totals = calculateTotals([line(100, 2)], { id: "c", code: "X", discountPercent: 10 });
    expect(totals.volumeDiscount).toBeCloseTo(20);
    expect(totals.couponDiscount).toBeCloseTo(18);
    expect(totals.discountAmount).toBeCloseTo(38);
    expect(totals.shipping).toBe(0);
  });

  it("handles an empty cart", () => {
    expect(calculateTotals([], null).subtotal).toBe(0);
  });
});

describe("isCheckoutReady", () => {
  it("requires both an address and at least one item", () => {
    expect(isCheckoutReady("", [line(1, 1)])).toBe(false);
    expect(isCheckoutReady("addr", [])).toBe(false);
    expect(isCheckoutReady("addr", [line(1, 1)])).toBe(true);
  });
});
