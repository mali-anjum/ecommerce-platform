import type { NextFunction, Response } from "express";

const findUniqueMock = jest.fn();
const createMock = jest.fn();

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
      create: (...args: unknown[]) => createMock(...args),
    },
  },
}));

import { createProduct, getProductByID } from "../productController";

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
      gender: "unisex",
      stock: 10,
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
          sellerId: true,
          stock: true,
          gender: true,
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

describe("createProduct validation", () => {
  it("rejects create requests without sizes", async () => {
    const req = {
      body: {
        name: "Trail Running Shoes",
        brand: "peak",
        description: "Lightweight",
        category: "Shoes",
        gender: "men",
        sizes: "",
        colors: "black",
        price: "120",
        stock: "10",
        image: "https://img.test/1.png",
      },
      files: [],
    } as any;
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = jest.fn() as NextFunction;

    createProduct(req, res, next);
    await new Promise(process.nextTick);

    expect(createMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "At least one size is required",
      })
    );
  });

  it("rejects create requests without colors", async () => {
    const req = {
      body: {
        name: "Trail Running Shoes",
        brand: "peak",
        description: "Lightweight",
        category: "Shoes",
        gender: "men",
        sizes: "42,43",
        colors: "",
        price: "120",
        stock: "10",
        image: "https://img.test/1.png",
      },
      files: [],
    } as any;
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = jest.fn() as NextFunction;

    createProduct(req, res, next);
    await new Promise(process.nextTick);

    expect(createMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "At least one color is required",
      })
    );
  });
});
