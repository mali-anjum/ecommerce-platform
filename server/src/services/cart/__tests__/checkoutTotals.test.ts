import {
  calculateCheckoutTotals,
  CHECKOUT_SHIPPING_FEE,
} from "../checkoutTotals";

describe("calculateCheckoutTotals", () => {
  it("applies volume discount, shipping, and tax for large subtotals", () => {
    const result = calculateCheckoutTotals(150, 0);

    expect(result.volumeDiscount).toBe(15);
    expect(result.shipping).toBe(0);
    expect(result.tax).toBeCloseTo((150 - 15) * 0.0889, 5);
    expect(result.total).toBeCloseTo(150 - 15 + result.tax, 5);
  });

  it("charges shipping for smaller subtotals", () => {
    const result = calculateCheckoutTotals(50, 0);

    expect(result.volumeDiscount).toBe(0);
    expect(result.shipping).toBe(CHECKOUT_SHIPPING_FEE);
    expect(result.total).toBeCloseTo(50 + CHECKOUT_SHIPPING_FEE + 50 * 0.0889, 5);
  });

  it("applies coupon discount after volume discount", () => {
    const result = calculateCheckoutTotals(150, 10);

    expect(result.volumeDiscount).toBe(15);
    expect(result.couponDiscount).toBeCloseTo(13.5, 5);
    expect(result.discountedSubtotal).toBeCloseTo(121.5, 5);
  });
});
