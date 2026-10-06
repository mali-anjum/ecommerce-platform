import type { NextFunction, Response } from "express";

const findUniqueMock = jest.fn();
const createMock = jest.fn();
const updateMock = jest.fn();

jest.mock("../../config/cloudinary", () => ({
  __esModule: true,
  default: { uploader: { upload_stream: jest.fn() } },
}));

jest.mock("../../lib/prisma", () => ({
  prisma: {
    product: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

jest.mock("../../services/ai/productIndex", () => ({
  scheduleProductIndexSync: jest.fn(),
}));

import { createProduct, updateProduct } from "../productController";

const baseBody = {
  description: "Thin and light",
  gender: "unisex",
  sizes: "13-inch",
  colors: "Silver",
  price: "999",
  stock: "5",
  image: "https://img.test/1.png",
};

function buildRes() {
  const status = jest.fn().mockReturnThis();
  const json = jest.fn().mockReturnThis();
  return { res: { status, json } as unknown as Response, status, json };
}

async function run(handler: typeof createProduct, req: unknown) {
  const { res, status } = buildRes();
  const next = jest.fn() as NextFunction;
  handler(req as never, res, next);
  await new Promise(process.nextTick);
  return { status, next };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createProduct text normalisation", () => {
  it("stores trimmed name, brand and category", async () => {
    createMock.mockResolvedValueOnce({ id: "prod-1" });
    const { status, next } = await run(createProduct, {
      body: { ...baseBody, name: " MacBook Air M2 ", brand: " Apple", category: " Laptops " },
      files: [],
    });

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(201);
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "MacBook Air M2",
        brand: "Apple",
        category: "Laptops",
      }),
    });
  });

  it.each(["name", "brand", "category"])("rejects a whitespace-only %s", async (field) => {
    const body = { ...baseBody, name: "Laptop", brand: "Apple", category: "Laptops", [field]: "   " };
    const { next } = await run(createProduct, { body, files: [] });

    expect(createMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Missing required fields: name, brand, category, gender, price, stock",
      })
    );
  });
});

describe("updateProduct text normalisation", () => {
  it("stores trimmed name, brand and category", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "prod-1", sellerId: null });
    updateMock.mockResolvedValueOnce({ id: "prod-1" });
    const { status, next } = await run(updateProduct, {
      params: { id: "prod-1" },
      body: { ...baseBody, name: " MacBook Air M2", brand: "Apple ", category: " Laptops" },
      user: { role: "SUPER_ADMIN" },
    });

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: expect.objectContaining({
        name: "MacBook Air M2",
        brand: "Apple",
        category: "Laptops",
      }),
    });
  });

  it("leaves omitted text fields undefined so Prisma does not overwrite them", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "prod-1", sellerId: null });
    updateMock.mockResolvedValueOnce({ id: "prod-1" });
    await run(updateProduct, {
      params: { id: "prod-1" },
      body: { ...baseBody },
      user: { role: "SUPER_ADMIN" },
    });

    const { data } = updateMock.mock.calls[0][0];
    expect(data.name).toBeUndefined();
    expect(data.brand).toBeUndefined();
    expect(data.category).toBeUndefined();
  });
});
