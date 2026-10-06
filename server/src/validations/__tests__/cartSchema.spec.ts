import { addToCartSchema, cartItemParamsSchema, updateCartItemSchema } from "../cartSchema";

describe("cart schemas", () => {
  it("accepts a valid add-to-cart payload", () => {
    expect(addToCartSchema.parse({ productId: "p1", quantity: 2 })).toEqual({ productId: "p1", quantity: 2 });
  });

  it.each([
    [{ productId: "", quantity: 1 }],
    [{ productId: "p1", quantity: 0 }],
    [{ productId: "p1", quantity: 1.5 }],
    [{ productId: "p1", quantity: "2" }],
    [{ quantity: 1 }],
  ])("rejects %o", (payload) => {
    expect(addToCartSchema.safeParse(payload).success).toBe(false);
  });

  it("validates update quantity", () => {
    expect(updateCartItemSchema.safeParse({ quantity: 3 }).success).toBe(true);
    expect(updateCartItemSchema.safeParse({ quantity: -3 }).success).toBe(false);
  });

  it("requires a cart item id param", () => {
    expect(cartItemParamsSchema.safeParse({ cartItemId: "" }).success).toBe(false);
    expect(cartItemParamsSchema.safeParse({ cartItemId: "ci-1" }).success).toBe(true);
  });
});
