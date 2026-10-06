import type { NextFunction, Response } from "express";

const productFindUnique = jest.fn();
const cartUpsert = jest.fn();
const cartItemUpsert = jest.fn();
const cartItemFindFirst = jest.fn();
const cartItemUpdate = jest.fn();
const cartItemDelete = jest.fn();
const cartItemDeleteMany = jest.fn();
const getOrCreateCart = jest.fn();
const validateCartItems = jest.fn();
const scheduleAnalyticsEvent = jest.fn();
const scheduleSalesAgentEvaluation = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    product: { findUnique: (...a: unknown[]) => productFindUnique(...a) },
    cart: { upsert: (...a: unknown[]) => cartUpsert(...a) },
    cartItem: {
      upsert: (...a: unknown[]) => cartItemUpsert(...a),
      findFirst: (...a: unknown[]) => cartItemFindFirst(...a),
      update: (...a: unknown[]) => cartItemUpdate(...a),
      delete: (...a: unknown[]) => cartItemDelete(...a),
      deleteMany: (...a: unknown[]) => cartItemDeleteMany(...a),
    },
  },
}));
jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../services/cart/get-cart-item", () => ({
  CartService: {
    getOrCreateCart: (...a: unknown[]) => getOrCreateCart(...a),
    validateCartItems: (...a: unknown[]) => validateCartItems(...a),
  },
}));
jest.mock("../../services/analytics/analyticsEventService", () => ({
  scheduleAnalyticsEvent: (...a: unknown[]) => scheduleAnalyticsEvent(...a),
}));
jest.mock("../../services/ai/sales", () => ({
  scheduleSalesAgentEvaluation: (...a: unknown[]) => scheduleSalesAgentEvaluation(...a),
}));

import {
  addToCart,
  clearEntireCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from "../cartController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const USER = { userId: "user-1", email: "a@b.co" };

async function run(handler: typeof addToCart, req: Record<string, unknown>) {
  const res = buildRes();
  const next = jest.fn() as NextFunction & jest.Mock;
  handler({ params: {}, body: {}, user: USER, ...req } as never, res, next);
  await new Promise((r) => setImmediate(r));
  return { res, next };
}

const product = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  name: "Tee",
  price: 20,
  images: ["img"],
  stock: 5,
  sizes: ["M", "L"],
  colors: ["Black"],
  isActive: true,
  isArchived: false,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe("addToCart", () => {
  const body = { productId: "p1", quantity: 2, size: " m ", color: "black" };

  it("rejects unauthenticated requests", async () => {
    const { next } = await run(addToCart, { user: undefined, body });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
    expect(cartUpsert).not.toHaveBeenCalled();
  });

  it("returns 400 when productId or quantity is missing", async () => {
    const { res } = await run(addToCart, { body: { productId: "p1" } });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 for an unknown product", async () => {
    productFindUnique.mockResolvedValueOnce(null);
    const { res } = await run(addToCart, { body });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it.each([[{ isActive: false }], [{ isArchived: true }]])("rejects unavailable products %o", async (flags) => {
    productFindUnique.mockResolvedValueOnce(product(flags));
    const { res } = await run(addToCart, { body });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toBe("This product is no longer available");
    expect(cartUpsert).not.toHaveBeenCalled();
  });

  it.each([-1, 1.5])("rejects invalid quantity %p", async (quantity) => {
    productFindUnique.mockResolvedValueOnce(product());
    const { res } = await run(addToCart, { body: { ...body, quantity } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(cartItemUpsert).not.toHaveBeenCalled();
  });

  it("rejects quantities above available stock", async () => {
    productFindUnique.mockResolvedValueOnce(product({ stock: 1 }));
    const { res } = await run(addToCart, { body });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toBe("Only 1 left in stock");
  });

  it("rejects out-of-stock products", async () => {
    productFindUnique.mockResolvedValueOnce(product({ stock: 0 }));
    const { res } = await run(addToCart, { body });
    expect(res.json.mock.calls[0][0].message).toBe("This product is out of stock");
  });

  it.each([
    [{ size: undefined }, "This product requires a size selection before adding to cart"],
    [{ size: "XXL" }, "Selected size is not available for this product"],
    [{ color: "" }, "This product requires a color selection before adding to cart"],
    [{ color: "Pink" }, "Selected color is not available for this product"],
  ])("validates variant selection %o", async (override, message) => {
    productFindUnique.mockResolvedValueOnce(product());
    const { res } = await run(addToCart, { body: { ...body, ...override } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toBe(message);
  });

  it("upserts the line (incrementing duplicates) and tracks analytics", async () => {
    productFindUnique
      .mockResolvedValueOnce(product())
      .mockResolvedValueOnce({ name: "Tee", price: 20, images: ["img"] });
    cartUpsert.mockResolvedValueOnce({ id: "cart-1" });
    cartItemUpsert.mockResolvedValueOnce({ id: "ci-1", productId: "p1", color: "black", size: "m", quantity: 2 });

    const { res } = await run(addToCart, { body: { ...body, sessionId: "sess-1" } });

    expect(cartUpsert).toHaveBeenCalledWith({ where: { userId: "user-1" }, create: { userId: "user-1" }, update: {} });
    expect(cartItemUpsert).toHaveBeenCalledWith({
      where: { cartId_productId_size_color: { cartId: "cart-1", productId: "p1", size: "m", color: "black" } },
      update: { quantity: { increment: 2 } },
      create: { cartId: "cart-1", productId: "p1", quantity: 2, size: "m", color: "black" },
    });
    expect(scheduleAnalyticsEvent).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", sessionId: "sess-1" }));
    expect(scheduleSalesAgentEvaluation).toHaveBeenCalledWith({ sessionId: "sess-1", userId: "user-1" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].data).toEqual({
      id: "ci-1",
      productId: "p1",
      name: "Tee",
      price: 20,
      image: "img",
      color: "black",
      size: "m",
      quantity: 2,
    });
  });

  it("uses default variant values for products without sizes/colors", async () => {
    productFindUnique
      .mockResolvedValueOnce(product({ sizes: [], colors: [] }))
      .mockResolvedValueOnce(null);
    cartUpsert.mockResolvedValueOnce({ id: "cart-1" });
    cartItemUpsert.mockResolvedValueOnce({ id: "ci-1", productId: "p1", color: "Default", size: "", quantity: 1 });
    await run(addToCart, { body: { productId: "p1", quantity: 1 } });
    expect(cartItemUpsert.mock.calls[0][0].create).toMatchObject({ size: "", color: "Default" });
    expect(scheduleSalesAgentEvaluation).not.toHaveBeenCalled();
  });
});

describe("getCart", () => {
  it("maps items, skips deleted products and totals the cart", async () => {
    getOrCreateCart.mockResolvedValueOnce({
      items: [
        { id: "a", color: "Black", size: "M", quantity: 2, product: { id: "p1", name: "Tee", price: 10, images: ["i"], stock: 1, isFeatured: false } },
        { id: "b", color: "Default", size: "", quantity: 1, product: null },
      ],
    });
    validateCartItems.mockResolvedValueOnce([{ itemId: "a", issue: "INSUFFICIENT_STOCK" }]);
    const { res } = await run(getCart, {});

    expect(getOrCreateCart).toHaveBeenCalledWith("user-1");
    const data = res.json.mock.calls[0][0].data;
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({ maxQuantity: 1, isAvailable: false });
    expect(data.totalItems).toBe(2);
    expect(data.totalPrice).toBe(20);
    expect(data.validationIssues).toEqual([{ itemId: "a", issue: "INSUFFICIENT_STOCK" }]);
  });

  it("returns 500 when loading fails", async () => {
    getOrCreateCart.mockRejectedValueOnce(new Error("db"));
    const { res } = await run(getCart, {});
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("removeFromCart", () => {
  it("deletes only within the user's cart", async () => {
    cartItemDelete.mockResolvedValueOnce({});
    const { res } = await run(removeFromCart, { params: { id: "ci-1" } });
    expect(cartItemDelete).toHaveBeenCalledWith({ where: { id: "ci-1", cart: { userId: "user-1" } } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 400 without an id", async () => {
    const { res } = await run(removeFromCart, {});
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("updateCartItemQuantity", () => {
  it.each([0, 2.5, "3"])("rejects quantity %p", async (quantity) => {
    const { res } = await run(updateCartItemQuantity, { params: { id: "ci-1" }, body: { quantity } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(cartItemUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 for another user's item", async () => {
    cartItemFindFirst.mockResolvedValueOnce(null);
    const { res } = await run(updateCartItemQuantity, { params: { id: "ci-x" }, body: { quantity: 1 } });
    expect(cartItemFindFirst.mock.calls[0][0].where).toEqual({ id: "ci-x", cart: { userId: "user-1" } });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("rejects quantities above stock", async () => {
    cartItemFindFirst.mockResolvedValueOnce({ product: { stock: 3 } });
    const { res } = await run(updateCartItemQuantity, { params: { id: "ci-1" }, body: { quantity: 4 } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toBe("Only 3 left in stock");
  });

  it("updates the quantity", async () => {
    cartItemFindFirst.mockResolvedValueOnce({ product: { stock: 9 } });
    cartItemUpdate.mockResolvedValueOnce({ id: "ci-1", productId: "p1", color: "Black", size: "M", quantity: 4 });
    productFindUnique.mockResolvedValueOnce({ name: "Tee", price: 10, images: ["i"] });
    const { res } = await run(updateCartItemQuantity, { params: { id: "ci-1" }, body: { quantity: 4 } });
    expect(cartItemUpdate).toHaveBeenCalledWith({
      where: { id: "ci-1", cart: { userId: "user-1" } },
      data: { quantity: 4 },
    });
    expect(res.json.mock.calls[0][0].data.quantity).toBe(4);
  });
});

describe("clearEntireCart", () => {
  it("removes every item in the user's cart", async () => {
    cartItemDeleteMany.mockResolvedValueOnce({ count: 3 });
    const { res } = await run(clearEntireCart, {});
    expect(cartItemDeleteMany).toHaveBeenCalledWith({ where: { cart: { userId: "user-1" } } });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
