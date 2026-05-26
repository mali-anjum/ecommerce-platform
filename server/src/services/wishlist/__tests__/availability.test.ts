import { getWishlistAvailability } from "../availability";

describe("getWishlistAvailability", () => {
  it("marks active in-stock products as available", () => {
    expect(
      getWishlistAvailability({
        isActive: true,
        isArchived: false,
        stock: 3,
      })
    ).toBe("available");
  });

  it("allows out-of-stock but still listable products", () => {
    expect(
      getWishlistAvailability({
        isActive: true,
        isArchived: false,
        stock: 0,
      })
    ).toBe("out_of_stock");
  });

  it("marks archived or inactive products unavailable", () => {
    expect(
      getWishlistAvailability({
        isActive: false,
        isArchived: false,
        stock: 10,
      })
    ).toBe("unavailable");

    expect(
      getWishlistAvailability({
        isActive: true,
        isArchived: true,
        stock: 10,
      })
    ).toBe("unavailable");
  });

  it("handles missing product", () => {
    expect(getWishlistAvailability(null)).toBe("unavailable");
  });
});
