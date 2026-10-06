import type { NextFunction, Response } from "express";

const sellerFindUnique = jest.fn();
const productCount = jest.fn();
const txSellerCreate = jest.fn();
const txUserUpdate = jest.fn();
const issueSessionForUser = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    seller: { findUnique: (...a: unknown[]) => sellerFindUnique(...a) },
    product: { count: (...a: unknown[]) => productCount(...a) },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        seller: { create: (...a: unknown[]) => txSellerCreate(...a) },
        user: { update: (...a: unknown[]) => txUserUpdate(...a) },
      }),
  },
}));
jest.mock("../authController", () => ({
  issueSessionForUser: (...a: unknown[]) => issueSessionForUser(...a),
}));

import { getMySellerProfile, registerAsSeller } from "../sellerController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
async function run(handler: typeof registerAsSeller, req: Record<string, unknown>) {
  const res = buildRes();
  const next = jest.fn() as NextFunction & jest.Mock;
  handler({ body: {}, ...req } as never, res, next);
  await new Promise((r) => setImmediate(r));
  return { res, next };
}
const shopper = { userId: "u1", email: "a@b.co", role: "USER" };

beforeEach(() => jest.clearAllMocks());

describe("registerAsSeller", () => {
  it("requires authentication", async () => {
    const { next } = await run(registerAsSeller, { body: { storeName: "Shop", slug: "shop" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it.each(["SELLER", "SUPER_ADMIN"])("rejects users who are already %s", async (role) => {
    const { next } = await run(registerAsSeller, { user: { ...shopper, role }, body: { storeName: "Shop", slug: "shop" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
    expect(txSellerCreate).not.toHaveBeenCalled();
  });

  it.each([
    [{ storeName: "A", slug: "shop" }, "storeName must be at least 2 characters"],
    [{ storeName: "Shop", slug: "s" }, "slug must be at least 2 characters"],
    [{ storeName: "Shop", slug: "my--shop" }, "slug must be lowercase letters, numbers, and single hyphens only"],
    [{ storeName: "Shop", slug: "my shop" }, "slug must be lowercase letters, numbers, and single hyphens only"],
    [{ storeName: "Shop", slug: "-shop" }, "slug must be lowercase letters, numbers, and single hyphens only"],
  ])("validates input %o", async (body, message) => {
    const { next } = await run(registerAsSeller, { user: shopper, body });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message });
  });

  it("rejects a taken slug", async () => {
    sellerFindUnique.mockResolvedValueOnce({ id: "s-other" });
    const { next } = await run(registerAsSeller, { user: shopper, body: { storeName: "Shop", slug: "shop" } });
    expect(next.mock.calls[0][0]).toMatchObject({ message: "This store slug is already taken" });
    expect(txSellerCreate).not.toHaveBeenCalled();
  });

  it("creates the seller, promotes the user and reissues the session", async () => {
    sellerFindUnique.mockResolvedValueOnce(null);
    txSellerCreate.mockResolvedValueOnce({ id: "s1", name: "My Shop", slug: "my-shop" });
    issueSessionForUser.mockResolvedValueOnce({ id: "u1", role: "SELLER" });
    const { res } = await run(registerAsSeller, {
      user: shopper,
      body: { storeName: "  My Shop ", slug: " My-Shop ", userId: "victim" },
    });

    expect(txSellerCreate).toHaveBeenCalledWith({ data: { name: "My Shop", slug: "my-shop", userId: "u1", isActive: true } });
    expect(txUserUpdate).toHaveBeenCalledWith({ where: { id: "u1" }, data: { role: "SELLER" } });
    expect(issueSessionForUser).toHaveBeenCalledWith(res, "u1");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].data).toEqual({
      seller: { id: "s1", name: "My Shop", slug: "my-shop" },
      user: { id: "u1", role: "SELLER" },
    });
  });
});

describe("getMySellerProfile", () => {
  it("requires a SELLER role", async () => {
    const { next } = await run(getMySellerProfile, { user: shopper });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it("returns 404 when the profile is missing", async () => {
    sellerFindUnique.mockResolvedValueOnce(null);
    const { next } = await run(getMySellerProfile, { user: { ...shopper, role: "SELLER" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 404 });
  });

  it("returns the profile with its product count", async () => {
    sellerFindUnique.mockResolvedValueOnce({ id: "s1", name: "Shop" });
    productCount.mockResolvedValueOnce(7);
    const { res } = await run(getMySellerProfile, { user: { ...shopper, role: "SELLER" } });
    expect(sellerFindUnique.mock.calls[0][0].where).toEqual({ userId: "u1" });
    expect(productCount).toHaveBeenCalledWith({ where: { sellerId: "s1" } });
    expect(res.json.mock.calls[0][0].data).toEqual({ id: "s1", name: "Shop", productCount: 7 });
  });
});
