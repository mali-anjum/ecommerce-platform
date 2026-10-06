import { buildWishlistSnapshot, getProductAvailability } from "../wishlistSnapshot";
import type { Product } from "@/components/products/types/product";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "MacBook Air",
    brand: "Apple",
    category: "Laptops",
    price: 1000,
    discountPercent: null,
    dealStartsAt: null,
    dealEndsAt: null,
    images: ["https://img/1.jpg", "https://img/2.jpg"],
    stock: 3,
    sizes: ["13"],
    colors: ["Silver"],
    ...overrides,
  } as Product;
}

describe("wishlistSnapshot", () => {
  it("derives availability from stock", () => {
    expect(getProductAvailability(product())).toBe("available");
    expect(getProductAvailability(product({ stock: 0 }))).toBe("out_of_stock");
    expect(getProductAvailability(product({ stock: -1 }))).toBe("out_of_stock");
    expect(getProductAvailability(undefined as unknown as Product)).toBe("unavailable");
  });

  it("captures the first image, pricing and variants", () => {
    const snapshot = buildWishlistSnapshot(product());
    expect(snapshot).toMatchObject({
      productId: "p1",
      thumbnail: "https://img/1.jpg",
      price: 1000,
      stock: 3,
      availability: "available",
      sizes: ["13"],
      colors: ["Silver"],
    });
  });

  it("uses a null thumbnail when there are no images", () => {
    expect(buildWishlistSnapshot(product({ images: [] })).thumbnail).toBeNull();
  });

  it("applies an active deal discount", () => {
    const now = Date.now();
    const snapshot = buildWishlistSnapshot(
      product({
        discountPercent: 25,
        dealStartsAt: new Date(now - 60_000).toISOString(),
        dealEndsAt: new Date(now + 60_000).toISOString(),
      } as Partial<Product>)
    );
    expect(snapshot.salePrice).toBe(750);
    expect(snapshot.discountPercent).toBe(25);
  });
});
