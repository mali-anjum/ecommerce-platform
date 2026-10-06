const cartUpsert = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: { cart: { upsert: (...a: unknown[]) => cartUpsert(...a) } },
}));

import { CartService } from "../get-cart-item";

describe("CartService.getOrCreateCart", () => {
  it("upserts the user's cart with newest items first and safe product fields", async () => {
    cartUpsert.mockResolvedValueOnce({ id: "cart-1", items: [] });
    await CartService.getOrCreateCart("user-1");
    const args = cartUpsert.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user-1" });
    expect(args.create).toEqual({ userId: "user-1" });
    expect(args.include.items.orderBy).toEqual({ createdAt: "desc" });
    expect(Object.keys(args.include.items.include.product.select).sort()).toEqual(
      ["id", "images", "isFeatured", "name", "price", "stock"],
    );
  });
});

describe("CartService.validateCartItems", () => {
  const item = (quantity: number, stock: number | null) => ({
    id: `i-${quantity}-${stock}`,
    quantity,
    product: stock === null ? null : { stock },
  });

  it("returns no issues for available lines", async () => {
    await expect(CartService.validateCartItems([item(2, 5), item(5, 5)])).resolves.toEqual([]);
  });

  it("flags deleted products", async () => {
    await expect(CartService.validateCartItems([item(1, null)])).resolves.toEqual([
      { itemId: "i-1-null", issue: "PRODUCT_NOT_FOUND" },
    ]);
  });

  it("flags quantities above stock with the available amount", async () => {
    await expect(CartService.validateCartItems([item(4, 3)])).resolves.toEqual([
      { itemId: "i-4-3", issue: "INSUFFICIENT_STOCK", available: 3, requested: 4 },
    ]);
  });

  it("reports a single OUT_OF_STOCK issue for empty stock", async () => {
    await expect(CartService.validateCartItems([item(1, 0)])).resolves.toEqual([
      { itemId: "i-1-0", issue: "OUT_OF_STOCK" },
    ]);
  });

  it("handles an empty cart", async () => {
    await expect(CartService.validateCartItems([])).resolves.toEqual([]);
  });
});
