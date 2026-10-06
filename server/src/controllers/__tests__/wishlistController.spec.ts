import type { NextFunction, Response } from "express";

const getUserWishlist = jest.fn();
const toggleItem = jest.fn();
const removeItem = jest.fn();

jest.mock("../../services/wishlist/wishlistService", () => ({
  WishlistService: {
    getUserWishlist: (...a: unknown[]) => getUserWishlist(...a),
    toggleItem: (...a: unknown[]) => toggleItem(...a),
    removeItem: (...a: unknown[]) => removeItem(...a),
  },
}));

import { getWishlist, removeWishlistItem, toggleWishlist } from "../wishlistController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
async function run(handler: typeof getWishlist, req: Record<string, unknown>) {
  const res = buildRes();
  const next = jest.fn() as NextFunction & jest.Mock;
  handler({ params: {}, body: {}, user: { userId: "u1", email: "a@b.co" }, ...req } as never, res, next);
  await new Promise((r) => setImmediate(r));
  return { res, next };
}

beforeEach(() => jest.clearAllMocks());

describe("wishlistController", () => {
  it("rejects unauthenticated requests", async () => {
    const { next } = await run(getWishlist, { user: undefined });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
    expect(getUserWishlist).not.toHaveBeenCalled();
  });

  it("returns the user's wishlist", async () => {
    getUserWishlist.mockResolvedValueOnce({ items: [], totalItems: 0, totalValue: 0 });
    const { res } = await run(getWishlist, {});
    expect(getUserWishlist).toHaveBeenCalledWith("u1");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("prefers validated productId and reports the toggle action", async () => {
    toggleItem.mockResolvedValueOnce({ action: "added", item: {}, productId: "p1" });
    const { res } = await run(toggleWishlist, { validatedData: { productId: "p1" }, body: { productId: "evil" } });
    expect(toggleItem).toHaveBeenCalledWith("u1", "p1");
    expect(res.json.mock.calls[0][0].message).toBe("Product added to wishlist");
  });

  it("reports removals", async () => {
    toggleItem.mockResolvedValueOnce({ action: "removed", item: null, productId: "p1" });
    const { res } = await run(toggleWishlist, { body: { productId: "p1" } });
    expect(res.json.mock.calls[0][0].message).toBe("Product removed from wishlist");
  });

  it("returns 400 without a product id", async () => {
    const { next } = await run(toggleWishlist, { body: { productId: 5 } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
  });

  it("removes an item by id", async () => {
    removeItem.mockResolvedValueOnce(undefined);
    const { res } = await run(removeWishlistItem, { params: { id: "i1" } });
    expect(removeItem).toHaveBeenCalledWith("u1", "i1");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("propagates 404 from the service", async () => {
    removeItem.mockRejectedValueOnce(Object.assign(new Error("Wishlist item not found"), { statusCode: 404 }));
    const { next } = await run(removeWishlistItem, { params: { id: "i1" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 404 });
  });
});
