import type { NextFunction, Response } from "express";

const findUniqueMock = jest.fn();

jest.mock("../../config/cloudinary", () => ({
  __esModule: true,
  default: {
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

jest.mock("../../lib/prisma", () => ({
  prisma: {
    product: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

import { getProductByID } from "../productController";

describe("getProductByID", () => {
  it("returns product data including subcategoryId", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "prod-1",
      name: "Trail Running Shoes",
      description: "Lightweight",
      price: 120,
      images: ["img-1"],
      brand: "peak",
      category: "Shoes",
      subcategoryId: "sub-shoes",
      sizes: ["42"],
      colors: ["black"],
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    });

    const req = { params: { id: "prod-1" } } as any;
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = jest.fn() as NextFunction;

    getProductByID(req, res, next);
    await new Promise(process.nextTick);

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod-1" },
        select: expect.objectContaining({
          subcategoryId: true,
        }),
      })
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        success: true,
        data: expect.objectContaining({
          subcategoryId: "sub-shoes",
        }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
