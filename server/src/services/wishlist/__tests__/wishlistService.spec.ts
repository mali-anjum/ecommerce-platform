import { Prisma } from "@prisma/client";

const productFindUnique = jest.fn();
const wishlistUpsert = jest.fn();
const wishlistFindUnique = jest.fn();
const itemFindMany = jest.fn();
const itemFindUnique = jest.fn();
const itemCreate = jest.fn();
const itemDelete = jest.fn();
const itemDeleteMany = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    product: { findUnique: (...a: unknown[]) => productFindUnique(...a) },
    wishlist: {
      upsert: (...a: unknown[]) => wishlistUpsert(...a),
      findUnique: (...a: unknown[]) => wishlistFindUnique(...a),
    },
    wishlistItem: {
      findMany: (...a: unknown[]) => itemFindMany(...a),
      findUnique: (...a: unknown[]) => itemFindUnique(...a),
      create: (...a: unknown[]) => itemCreate(...a),
      delete: (...a: unknown[]) => itemDelete(...a),
      deleteMany: (...a: unknown[]) => itemDeleteMany(...a),
    },
  },
}));
jest.mock("../../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { WishlistService } from "../wishlistService";

const product = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  name: "Lamp",
  brand: "Halo",
  category: "Lighting",
  price: 100,
  discountPercent: null,
  dealStartsAt: null,
  dealEndsAt: null,
  stock: 3,
  images: ["img-1", "img-2"],
  isActive: true,
  isArchived: false,
  sizes: [],
  colors: ["White"],
  ...overrides,
});
const row = (id: string, productOverrides: Record<string, unknown> = {}) => ({
  id,
  createdAt: new Date("2026-01-02T03:04:05Z"),
  product: product(productOverrides),
});

beforeEach(() => {
  jest.clearAllMocks();
  wishlistUpsert.mockResolvedValue({ id: "w1", userId: "u1" });
});

describe("WishlistService.getOrCreateWishlist", () => {
  it("upserts by userId", async () => {
    await WishlistService.getOrCreateWishlist("u1");
    expect(wishlistUpsert).toHaveBeenCalledWith({ where: { userId: "u1" }, create: { userId: "u1" }, update: {} });
  });
});

describe("WishlistService.getUserWishlist", () => {
  it("maps rows to DTOs with availability and totals effective prices", async () => {
    itemFindMany.mockResolvedValueOnce([
      row("i1"),
      row("i2", { id: "p2", price: 50, discountPercent: 20 }),
      row("i3", { id: "p3", stock: 0 }),
      row("i4", { id: "p4", isArchived: true, images: [] }),
    ]);
    const result = await WishlistService.getUserWishlist("u1");

    expect(itemFindMany.mock.calls[0][0].where).toEqual({ wishlistId: "w1" });
    expect(result.totalItems).toBe(4);
    expect(result.items[0]).toMatchObject({
      id: "i1",
      productId: "p1",
      thumbnail: "img-1",
      salePrice: null,
      availability: "available",
      isPurchasable: true,
      addedAt: "2026-01-02T03:04:05.000Z",
    });
    expect(result.items[1]).toMatchObject({ salePrice: 40, discountPercent: 20 });
    expect(result.items[2]).toMatchObject({ availability: "out_of_stock", isPurchasable: false });
    expect(result.items[3]).toMatchObject({ availability: "unavailable", thumbnail: null });
    expect(result.totalValue).toBe(100 + 40 + 100 + 100);
  });

  it("returns an empty wishlist", async () => {
    itemFindMany.mockResolvedValueOnce([]);
    await expect(WishlistService.getUserWishlist("u1")).resolves.toEqual({ items: [], totalItems: 0, totalValue: 0 });
  });
});

describe("WishlistService.toggleItem", () => {
  it("throws 404 for unknown products", async () => {
    productFindUnique.mockResolvedValueOnce(null);
    await expect(WishlistService.toggleItem("u1", "nope")).rejects.toMatchObject({ statusCode: 404 });
    expect(wishlistUpsert).not.toHaveBeenCalled();
  });

  it("adds a product that is not saved yet", async () => {
    productFindUnique.mockResolvedValueOnce({ id: "p1" });
    itemFindUnique.mockResolvedValueOnce(null);
    itemCreate.mockResolvedValueOnce(row("i1"));
    const result = await WishlistService.toggleItem("u1", "p1");
    expect(itemCreate.mock.calls[0][0].data).toEqual({ wishlistId: "w1", productId: "p1" });
    expect(result).toMatchObject({ action: "added", productId: "p1", item: { id: "i1" } });
  });

  it("removes a product that is already saved", async () => {
    productFindUnique.mockResolvedValueOnce({ id: "p1" });
    itemFindUnique.mockResolvedValueOnce(row("i1"));
    const result = await WishlistService.toggleItem("u1", "p1");
    expect(itemDelete).toHaveBeenCalledWith({ where: { id: "i1" } });
    expect(result).toEqual({ action: "removed", item: null, productId: "p1" });
  });

  it("resolves a concurrent-create conflict as a removal", async () => {
    productFindUnique.mockResolvedValueOnce({ id: "p1" });
    itemFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(row("i9"));
    itemCreate.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "t" }));
    const result = await WishlistService.toggleItem("u1", "p1");
    expect(itemDelete).toHaveBeenCalledWith({ where: { id: "i9" } });
    expect(result.action).toBe("removed");
  });

  it("rethrows other database errors", async () => {
    productFindUnique.mockResolvedValueOnce({ id: "p1" });
    itemFindUnique.mockResolvedValueOnce(null);
    itemCreate.mockRejectedValueOnce(new Error("db down"));
    await expect(WishlistService.toggleItem("u1", "p1")).rejects.toThrow("db down");
  });
});

describe("WishlistService.removeItem", () => {
  it("deletes only from the user's wishlist", async () => {
    itemDeleteMany.mockResolvedValueOnce({ count: 1 });
    await WishlistService.removeItem("u1", "i1");
    expect(itemDeleteMany).toHaveBeenCalledWith({ where: { id: "i1", wishlist: { userId: "u1" } } });
  });

  it("throws 404 when nothing was deleted (missing or another user's item)", async () => {
    itemDeleteMany.mockResolvedValueOnce({ count: 0 });
    await expect(WishlistService.removeItem("u1", "i1")).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("WishlistService.isProductInWishlist", () => {
  it("returns false when the user has no wishlist", async () => {
    wishlistFindUnique.mockResolvedValueOnce(null);
    await expect(WishlistService.isProductInWishlist("u1", "p1")).resolves.toBe(false);
    expect(itemFindUnique).not.toHaveBeenCalled();
  });

  it("reflects whether the item exists", async () => {
    wishlistFindUnique.mockResolvedValue({ id: "w1" });
    itemFindUnique.mockResolvedValueOnce({ id: "i1" }).mockResolvedValueOnce(null);
    await expect(WishlistService.isProductInWishlist("u1", "p1")).resolves.toBe(true);
    await expect(WishlistService.isProductInWishlist("u1", "p2")).resolves.toBe(false);
  });
});
