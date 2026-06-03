jest.mock("../../../lib/prisma", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "../../../lib/prisma";
import { getProductRecommendations } from "../recommendations/ProductRecommendationService";

const mockFindMany = prisma.product.findMany as jest.Mock;

const sampleRow = {
  id: "p1",
  name: "Budget Laptop",
  brand: "TechCo",
  price: 480,
  discountPercent: 10,
  images: ["https://example.com/laptop.jpg"],
  category: "Electronics",
  stock: 5,
  soldCount: 100,
  rating: 4.5,
};

describe("getProductRecommendations", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("returns product_recommendation intent with mapped products", async () => {
    mockFindMany.mockResolvedValueOnce([sampleRow]);

    const result = await getProductRecommendations("Best laptops under $500", {
      maxPrice: 500,
      categories: ["Electronics", "Laptops"],
      sortBy: "popular",
    });

    expect(result.intent).toBe("product_recommendation");
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({
      id: "p1",
      name: "Budget Laptop",
      effectivePrice: 432,
      discountPercent: 10,
    });
  });

  it("filters out products above max effective price", async () => {
    mockFindMany.mockResolvedValueOnce([
      sampleRow,
      {
        ...sampleRow,
        id: "p2",
        name: "Premium Laptop",
        price: 600,
        discountPercent: null,
      },
    ]);

    const result = await getProductRecommendations("laptops under $500", {
      maxPrice: 500,
      sortBy: "price_asc",
    });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].id).toBe("p1");
  });

  it("includes discounted items whose list price exceeds budget but effective price does not", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        ...sampleRow,
        id: "p3",
        price: 550,
        discountPercent: 20,
      },
    ]);

    const result = await getProductRecommendations("laptops under $500", {
      maxPrice: 500,
      sortBy: "price_asc",
    });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].effectivePrice).toBe(440);
  });

  it("queries with stock and active filters", async () => {
    mockFindMany.mockResolvedValue([]);

    await getProductRecommendations("cheap sneakers", {
      preferDiscount: true,
      sortBy: "discount",
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          isArchived: false,
          stock: { gt: 0 },
          discountPercent: { gt: 0 },
        }),
        take: 6,
      }),
    );
  });
});
