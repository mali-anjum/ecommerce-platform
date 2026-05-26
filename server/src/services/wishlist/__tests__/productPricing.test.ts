import {
  computeProductPricing,
  getEffectiveUnitPrice,
} from "../productPricing";

describe("computeProductPricing", () => {
  it("returns list price when no discount", () => {
    const result = computeProductPricing({ price: 100 });
    expect(result.salePrice).toBeNull();
    expect(result.hasActiveDeal).toBe(false);
    expect(getEffectiveUnitPrice(result)).toBe(100);
  }); 

  it("applies discount when deal window is active", () => {
    const now = new Date("2026-05-25T12:00:00Z");
    const result = computeProductPricing(
      {
        price: 200,
        discountPercent: 25,
        dealStartsAt: "2026-05-01T00:00:00Z",
        dealEndsAt: "2026-06-01T00:00:00Z",
      },
      now
    );

    expect(result.hasActiveDeal).toBe(true);
    expect(result.salePrice).toBe(150);
    expect(getEffectiveUnitPrice(result)).toBe(150);
  });

  it("ignores expired deals", () => {
    const now = new Date("2026-07-01T00:00:00Z");
    const result = computeProductPricing(
      {
        price: 80,
        discountPercent: 50,
        dealEndsAt: "2026-06-01T00:00:00Z",
      },
      now
    );

    expect(result.hasActiveDeal).toBe(false);
    expect(result.salePrice).toBeNull();
  });
});
