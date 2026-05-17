const productUpdateMock = jest.fn();
const couponUpdateMock = jest.fn();
const cartItemDeleteManyMock = jest.fn();
const cartDeleteMock = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    product: {
      update: (...args: unknown[]) => productUpdateMock(...args),
    },
    coupon: {
      update: (...args: unknown[]) => couponUpdateMock(...args),
    },
    cartItem: {
      deleteMany: (...args: unknown[]) => cartItemDeleteManyMock(...args),
    },
    cart: {
      delete: (...args: unknown[]) => cartDeleteMock(...args),
    },
  },
}));

import { applyPurchaseFulfillment } from "../fulfillment";

describe("applyPurchaseFulfillment", () => {
  beforeEach(() => {
    productUpdateMock.mockReset();
    couponUpdateMock.mockReset();
    cartItemDeleteManyMock.mockReset();
    cartDeleteMock.mockReset();
    productUpdateMock.mockResolvedValue(undefined);
    couponUpdateMock.mockResolvedValue(undefined);
    cartItemDeleteManyMock.mockResolvedValue({ count: 0 });
    cartDeleteMock.mockResolvedValue(undefined);
  });

  it("updates stock for lines with productId and clears cart", async () => {
    await applyPurchaseFulfillment("user-1", [
      { productId: "p1", quantity: 2 },
      { productId: null, quantity: 1 },
    ]);

    expect(productUpdateMock).toHaveBeenCalledTimes(1);
    expect(cartItemDeleteManyMock).toHaveBeenCalled();
    expect(cartDeleteMock).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("removes only purchased cart item ids when provided", async () => {
    await applyPurchaseFulfillment(
      "user-1",
      [{ productId: "p1", quantity: 1 }],
      ["cart-item-1", "cart-item-2"]
    );

    expect(cartItemDeleteManyMock).toHaveBeenCalledWith({
      where: {
        id: { in: ["cart-item-1", "cart-item-2"] },
        cart: { userId: "user-1" },
      },
    });
    expect(cartDeleteMock).not.toHaveBeenCalled();
  });

  it("increments coupon when line has couponId", async () => {
    await applyPurchaseFulfillment("user-1", [
      { productId: "p1", quantity: 1, couponId: "c1" },
    ]);

    expect(couponUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: { usageCount: { increment: 1 } },
      })
    );
  });
});
