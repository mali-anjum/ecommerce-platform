import { computeProductPricing, getDisplayPrice } from "../../components/products/utils/productPricing";

describe("computeProductPricing (client)", () => {
  it("uses sale price when deal is active", () => {
    const pricing = computeProductPricing(
      {
        price: 100,
        discountPercent: 20,
        dealStartsAt: "2020-01-01T00:00:00Z",
        dealEndsAt: "2099-01-01T00:00:00Z",
      },
      new Date("2026-05-25T00:00:00Z")
    );

    expect(pricing.salePrice).toBe(80);
    expect(getDisplayPrice(pricing)).toBe(80);
  });
});
