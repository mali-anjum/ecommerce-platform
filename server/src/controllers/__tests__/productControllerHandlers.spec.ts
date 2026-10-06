import type { NextFunction, Response } from "express";

jest.mock("../../config/cloudinary", () => ({
  __esModule: true,
  default: { uploader: { upload_stream: jest.fn() } },
}));
jest.mock("../../lib/prisma", () => ({
  prisma: {
    product: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    seller: { findUnique: jest.fn() },
    subcategory: { findUnique: jest.fn(), findFirst: jest.fn() },
  },
}));
jest.mock("../../services/ai/productIndex", () => ({ scheduleProductIndexSync: jest.fn() }));
jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../services/product", () => ({
  ...jest.requireActual("../../services/product"),
  fetchClientProductListing: jest.fn(),
  fetchProductsForAdminPaginated: jest.fn(),
  getProductCategoriesPayload: jest.fn(),
}));

import cloudinary from "../../config/cloudinary";
import { prisma } from "../../lib/prisma";
import { scheduleProductIndexSync } from "../../services/ai/productIndex";
import {
  fetchClientProductListing,
  fetchProductsForAdminPaginated,
  getProductCategoriesPayload,
} from "../../services/product";
import {
  createProduct,
  deleteProduct,
  fetchAllProductsForAdmin,
  getProductCategories,
  getProductsForClient,
  updateProduct,
} from "../productController";
import { ApiError } from "../../utils/ApiError";

const db = prisma as unknown as {
  product: Record<string, jest.Mock>;
  seller: Record<string, jest.Mock>;
  subcategory: Record<string, jest.Mock>;
};
const uploadStream = cloudinary.uploader.upload_stream as unknown as jest.Mock;

type Handler = typeof createProduct;

async function run(handler: Handler, req: Record<string, unknown>) {
  const status = jest.fn().mockReturnThis();
  const json = jest.fn().mockReturnThis();
  const next = jest.fn() as jest.Mock & NextFunction;
  handler({ params: {}, query: {}, body: {}, ...req } as never, { status, json } as unknown as Response, next);
  await new Promise((resolve) => setImmediate(resolve));
  const error = next.mock.calls[0]?.[0] as ApiError | undefined;
  return { status: status.mock.calls[0]?.[0] as number | undefined, body: json.mock.calls[0]?.[0], error };
}

const admin = { userId: "admin-1", role: "SUPER_ADMIN" };
const seller = { userId: "seller-user", role: "SELLER" };

const validBody = {
  name: "MacBook Air",
  brand: "Apple",
  category: "Laptops",
  gender: "unisex",
  description: "Thin",
  sizes: "13-inch",
  colors: "Silver",
  price: "999.5",
  stock: "5",
  image: "https://img.test/1.png",
};

beforeEach(() => {
  jest.resetAllMocks();
  db.product.create.mockImplementation(({ data }: { data: object }) => Promise.resolve({ id: "p-new", ...data }));
  db.product.update.mockImplementation(({ data }: { data: object }) => Promise.resolve({ id: "p1", ...data }));
});

describe("createProduct", () => {
  it.each<[string, Record<string, unknown>, RegExp]>([
    ["missing name", { name: "   " }, /Missing required fields/],
    ["no images", { image: undefined }, /No images uploaded/],
    ["negative price", { price: "-1" }, /price must be a non-negative number/],
    ["non-numeric price", { price: "abc" }, /price must be/],
    ["fractional stock", { stock: "2.5" }, /stock must be a non-negative integer/],
    ["negative stock", { stock: "-3" }, /stock must be/],
    ["bad condition", { condition: "BROKEN" }, /condition must be one of/],
    ["discount over 100", { discountPercent: "150" }, /discountPercent must be between 0 and 100/],
    ["invalid deal date", { dealStartsAt: "not-a-date" }, /Invalid dealStartsAt/],
    ["deal start after end", { dealStartsAt: "2026-05-02", dealEndsAt: "2026-05-01" }, /cannot be after/],
  ])("returns 400 for %s", async (_label, overrides, message) => {
    const { error } = await run(createProduct, { user: admin, body: { ...validBody, ...overrides } });
    expect(error?.statusCode).toBe(400);
    expect(error?.message).toMatch(message);
    expect(db.product.create).not.toHaveBeenCalled();
  });

  it("creates a product with parsed numbers, defaults and index sync", async () => {
    const { status, body } = await run(createProduct, { user: admin, body: { ...validBody, discountPercent: "" } });
    expect(status).toBe(201);
    expect(body.data).toMatchObject({ price: 999.5, stock: 5, condition: "NEW", discountPercent: null, sellerId: null, images: ["https://img.test/1.png"] });
    expect(scheduleProductIndexSync).toHaveBeenCalledWith("p-new");
  });

  it("forces a SELLER's products onto their own seller profile, ignoring body.sellerId", async () => {
    await run(createProduct, { user: seller, sellerProfile: { id: "s-own" }, body: { ...validBody, sellerId: "s-other" } });
    expect(db.product.create.mock.calls[0][0].data.sellerId).toBe("s-own");
    expect(db.seller.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a SELLER without a seller profile", async () => {
    const { error } = await run(createProduct, { user: seller, body: validBody });
    expect(error?.statusCode).toBe(401);
  });

  it("validates sellerId supplied by a SUPER_ADMIN", async () => {
    db.seller.findUnique.mockResolvedValue(null);
    const { error } = await run(createProduct, { user: admin, body: { ...validBody, sellerId: "missing" } });
    expect(error?.message).toBe("Invalid sellerId");
  });

  it("resolves the category from subcategoryId", async () => {
    db.subcategory.findUnique.mockResolvedValue({ id: "sub-1", title: "Laptops & Notebooks" });
    await run(createProduct, { user: admin, body: { ...validBody, subcategoryId: " sub-1 " } });
    expect(db.product.create.mock.calls[0][0].data).toMatchObject({ subcategoryId: "sub-1", category: "Laptops & Notebooks" });
  });

  it("rejects an unknown subcategoryId", async () => {
    db.subcategory.findUnique.mockResolvedValue(null);
    const { error } = await run(createProduct, { user: admin, body: { ...validBody, subcategoryId: "nope" } });
    expect(error?.statusCode).toBe(400);
  });

  it("resolves by department + subcategory slug, keeping the typed category if not found", async () => {
    db.subcategory.findFirst.mockResolvedValueOnce({ id: "sub-2", title: "Phones" }).mockResolvedValueOnce(null);
    await run(createProduct, { user: admin, body: { ...validBody, departmentSlug: " Electronics ", subcategorySlug: "PHONES" } });
    expect(db.subcategory.findFirst.mock.calls[0][0].where).toEqual({ slug: "phones", department: { slug: "electronics" } });
    expect(db.product.create.mock.calls[0][0].data.category).toBe("Phones");

    await run(createProduct, { user: admin, body: { ...validBody, departmentSlug: "x", subcategorySlug: "y" } });
    expect(db.product.create.mock.calls[1][0].data).toMatchObject({ category: "Laptops", subcategoryId: null });
  });

  it("uploads multer files to Cloudinary and stores their URLs", async () => {
    uploadStream.mockImplementation((_opts: unknown, cb: (e: Error | null, r?: { secure_url: string }) => void) => ({
      end: () => cb(null, { secure_url: "https://res.cloudinary.com/p.jpg" }),
    }));
    const { status } = await run(createProduct, {
      user: admin,
      files: [{ buffer: Buffer.from("img") }],
      body: { ...validBody, image: undefined },
    });
    expect(status).toBe(201);
    expect(db.product.create.mock.calls[0][0].data.images).toEqual(["https://res.cloudinary.com/p.jpg"]);
  });

  it("fails without creating the product when the image upload fails", async () => {
    uploadStream.mockImplementation((_opts: unknown, cb: (e: Error | null) => void) => ({ end: () => cb(new Error("cloudinary down")) }));
    const { error } = await run(createProduct, { user: admin, files: [{ buffer: Buffer.from("img") }], body: validBody });
    expect(error?.message).toBe("cloudinary down");
    expect(db.product.create).not.toHaveBeenCalled();
  });
});

describe("updateProduct", () => {
  it("returns 404 for an unknown product", async () => {
    db.product.findUnique.mockResolvedValue(null);
    const { error } = await run(updateProduct, { user: admin, params: { id: "missing" }, body: validBody });
    expect(error?.statusCode).toBe(404);
  });

  it("forbids a SELLER from editing another seller's product", async () => {
    db.product.findUnique.mockResolvedValue({ id: "p1", sellerId: "s-other" });
    const { error } = await run(updateProduct, { user: seller, sellerProfile: { id: "s-own" }, params: { id: "p1" }, body: validBody });
    expect(error?.statusCode).toBe(401);
    expect(db.product.update).not.toHaveBeenCalled();
  });

  it.each([
    ["missing price", { price: undefined }],
    ["NaN stock", { stock: "lots" }],
    ["negative price", { price: "-10" }],
  ])("returns 400 for %s instead of writing NaN", async (_label, overrides) => {
    db.product.findUnique.mockResolvedValue({ id: "p1", sellerId: null });
    const { error } = await run(updateProduct, { user: admin, params: { id: "p1" }, body: { ...validBody, ...overrides } });
    expect(error?.statusCode).toBe(400);
    expect(db.product.update).not.toHaveBeenCalled();
  });

  it("lets a SELLER update their own product but never reassign it", async () => {
    db.product.findUnique.mockResolvedValue({ id: "p1", sellerId: "s-own" });
    const { status } = await run(updateProduct, {
      user: seller,
      sellerProfile: { id: "s-own" },
      params: { id: "p1" },
      body: { ...validBody, sellerId: "s-other", rating: "4.5" },
    });
    expect(status).toBe(200);
    const data = db.product.update.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("sellerId");
    expect(data).toMatchObject({ price: 999.5, stock: 5, rating: 4.5 });
    expect(scheduleProductIndexSync).toHaveBeenCalledWith("p1");
  });

  it("lets a SUPER_ADMIN clear the seller and subcategory, and clear deal dates", async () => {
    db.product.findUnique.mockResolvedValue({ id: "p1", sellerId: "s1" });
    await run(updateProduct, {
      user: admin,
      params: { id: "p1" },
      body: { ...validBody, sellerId: " ", subcategoryId: "", dealStartsAt: "", dealEndsAt: null, discountPercent: "" },
    });
    const data = db.product.update.mock.calls[0][0].data;
    expect(data).toMatchObject({ sellerId: null, subcategoryId: null, dealStartsAt: null, dealEndsAt: null });
    expect(data).not.toHaveProperty("discountPercent");
  });

  it("rejects invalid deal dates and discount", async () => {
    db.product.findUnique.mockResolvedValue({ id: "p1", sellerId: null });
    const bad = await run(updateProduct, { user: admin, params: { id: "p1" }, body: { ...validBody, dealEndsAt: "nope" } });
    expect(bad.error?.message).toBe("Invalid deal date value");
    const discount = await run(updateProduct, { user: admin, params: { id: "p1" }, body: { ...validBody, discountPercent: "-5" } });
    expect(discount.error?.statusCode).toBe(400);
  });
});

describe("deleteProduct", () => {
  it("404s for an unknown product", async () => {
    db.product.findUnique.mockResolvedValue(null);
    expect((await run(deleteProduct, { user: admin, params: { id: "x" } })).error?.statusCode).toBe(404);
  });

  it("forbids deleting another seller's product", async () => {
    db.product.findUnique.mockResolvedValue({ sellerId: "s-other" });
    const { error } = await run(deleteProduct, { user: seller, sellerProfile: { id: "s-own" }, params: { id: "p1" } });
    expect(error?.statusCode).toBe(401);
    expect(db.product.delete).not.toHaveBeenCalled();
  });

  it("deletes and removes the product from the AI index", async () => {
    db.product.findUnique.mockResolvedValue({ sellerId: null });
    const { status } = await run(deleteProduct, { user: admin, params: { id: "p1" } });
    expect(status).toBe(200);
    expect(db.product.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
    expect(scheduleProductIndexSync).toHaveBeenCalledWith("p1");
  });
});

describe("fetchAllProductsForAdmin", () => {
  it("requires authentication and an admin/seller role", async () => {
    expect((await run(fetchAllProductsForAdmin, {})).error?.statusCode).toBe(401);
    expect((await run(fetchAllProductsForAdmin, { user: { userId: "u", role: "USER" } })).error?.statusCode).toBe(401);
    expect((await run(fetchAllProductsForAdmin, { user: seller })).error?.message).toBe("Seller profile required");
  });

  it("scopes sellers to their own products and admins to all", async () => {
    (fetchProductsForAdminPaginated as jest.Mock).mockResolvedValue({ items: [], meta: {} });
    await run(fetchAllProductsForAdmin, { user: seller, sellerProfile: { id: "s-own" }, query: { page: "2", limit: "10" } });
    expect((fetchProductsForAdminPaginated as jest.Mock).mock.calls[0]).toEqual(["s-own", 2, 10]);
    await run(fetchAllProductsForAdmin, { user: admin });
    expect((fetchProductsForAdminPaginated as jest.Mock).mock.calls[1][0]).toBeNull();
  });
});

describe("public listing endpoints", () => {
  it("passes the query through to the listing service", async () => {
    (fetchClientProductListing as jest.Mock).mockResolvedValue({ products: [] });
    const { status, body } = await run(getProductsForClient, { query: { category: "Laptops" } });
    expect(status).toBe(200);
    expect(fetchClientProductListing).toHaveBeenCalledWith({ category: "Laptops" });
    expect(body.data).toEqual({ products: [] });
  });

  it("returns category counts", async () => {
    (getProductCategoriesPayload as jest.Mock).mockResolvedValue([{ name: "Laptops", count: 3 }]);
    const { body } = await run(getProductCategories, {});
    expect(body.data).toEqual([{ name: "Laptops", count: 3 }]);
  });
});
