import type { Response } from "express";

const bannerCreate = jest.fn((args: unknown) => ({ op: "create", args }));
const bannerFindMany = jest.fn();
const productUpdateMany = jest.fn((args: unknown) => ({ op: "updateMany", args }));
const productFindMany = jest.fn();
const transaction = jest.fn();
const uploadImageBuffer = jest.fn();
const scheduleProductIndexRebuild = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    featureBanner: {
      create: (a: unknown) => bannerCreate(a),
      findMany: (...a: unknown[]) => bannerFindMany(...a),
    },
    product: {
      updateMany: (a: unknown) => productUpdateMany(a),
      findMany: (...a: unknown[]) => productFindMany(...a),
    },
    $transaction: (...a: unknown[]) => transaction(...a),
  },
}));
jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../services/media/uploadImage", () => ({
  uploadImageBuffer: (...a: unknown[]) => uploadImageBuffer(...a),
}));
jest.mock("../../services/ai/productIndex", () => ({
  scheduleProductIndexRebuild: () => scheduleProductIndexRebuild(),
}));

import {
  addFeatureBanners,
  fetchFeatureBanners,
  getFeaturedProducts,
  updateFeaturedProducts,
} from "../settingsController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe("addFeatureBanners", () => {
  it("returns 400 without files", async () => {
    const res = buildRes();
    await addFeatureBanners({ files: [] } as never, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(uploadImageBuffer).not.toHaveBeenCalled();
  });

  it("uploads in-memory buffers and stores the URLs", async () => {
    const files = [{ buffer: Buffer.from("a") }, { buffer: Buffer.from("b") }];
    uploadImageBuffer.mockResolvedValueOnce("https://cdn/a.jpg").mockResolvedValueOnce("https://cdn/b.jpg");
    transaction.mockResolvedValueOnce([{ id: "b1" }, { id: "b2" }]);
    const res = buildRes();
    await addFeatureBanners({ files } as never, res);

    expect(uploadImageBuffer).toHaveBeenCalledWith(files[0].buffer, "ecommerce-prisma/ecommerce-feature-banners");
    expect(bannerCreate).toHaveBeenCalledWith({ data: { imageUrl: "https://cdn/a.jpg" } });
    expect(bannerCreate).toHaveBeenCalledWith({ data: { imageUrl: "https://cdn/b.jpg" } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, banners: [{ id: "b1" }, { id: "b2" }] });
  });

  it("returns 500 and stores nothing when an upload fails", async () => {
    uploadImageBuffer.mockRejectedValueOnce(new Error("cloudinary down"));
    const res = buildRes();
    await addFeatureBanners({ files: [{ buffer: Buffer.from("a") }] } as never, res);
    expect(transaction).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("fetchFeatureBanners", () => {
  it("returns banners newest first", async () => {
    bannerFindMany.mockResolvedValueOnce([{ id: "b1" }]);
    const res = buildRes();
    await fetchFeatureBanners({} as never, res);
    expect(bannerFindMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
    expect(res.json).toHaveBeenCalledWith({ success: true, banners: [{ id: "b1" }] });
  });

  it("returns 500 on failure", async () => {
    bannerFindMany.mockRejectedValueOnce(new Error("db"));
    const res = buildRes();
    await fetchFeatureBanners({} as never, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("updateFeaturedProducts", () => {
  it.each([[undefined], ["p1"], [Array.from({ length: 9 }, (_, i) => `p${i}`)], [["p1", 5]], [["  "]]])(
    "rejects invalid productIds %p",
    async (productIds) => {
      const res = buildRes();
      await updateFeaturedProducts({ body: { productIds } } as never, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(transaction).not.toHaveBeenCalled();
    }
  );

  it("swaps featured products atomically and rebuilds the AI index", async () => {
    transaction.mockResolvedValueOnce([]);
    const res = buildRes();
    await updateFeaturedProducts({ body: { productIds: ["p1", "p2"] } } as never, res);

    const ops = transaction.mock.calls[0][0];
    expect(ops).toEqual([
      { op: "updateMany", args: { where: { isFeatured: true }, data: { isFeatured: false } } },
      { op: "updateMany", args: { where: { id: { in: ["p1", "p2"] } }, data: { isFeatured: true } } },
    ]);
    expect(scheduleProductIndexRebuild).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("allows clearing all featured products", async () => {
    transaction.mockResolvedValueOnce([]);
    const res = buildRes();
    await updateFeaturedProducts({ body: { productIds: [] } } as never, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 500 and skips the rebuild when the transaction fails", async () => {
    transaction.mockRejectedValueOnce(new Error("db"));
    const res = buildRes();
    await updateFeaturedProducts({ body: { productIds: ["p1"] } } as never, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(scheduleProductIndexRebuild).not.toHaveBeenCalled();
  });
});

describe("getFeaturedProducts", () => {
  it("only returns active, non-archived featured products", async () => {
    productFindMany.mockResolvedValueOnce([{ id: "p1" }]);
    const res = buildRes();
    await getFeaturedProducts({} as never, res);
    expect(productFindMany).toHaveBeenCalledWith({ where: { isFeatured: true, isActive: true, isArchived: false } });
    expect(res.json).toHaveBeenCalledWith({ success: true, featuredProducts: [{ id: "p1" }] });
  });
});
