import { productIndexStore } from "../productIndexStore";
import {
  queryRecommendationsFromIndex,
  searchAssistantProductsFromIndex,
} from "../productIndexQuery";
import type { AiProductIndexEntry } from "../types";

const sampleEntries: AiProductIndexEntry[] = [
  {
    id: "p1",
    name: "Budget Laptop",
    brand: "TechCo",
    description: "Affordable laptop",
    price: 480,
    stock: 4,
    category: "Electronics",
    condition: "NEW",
    discountPercent: 10,
    effectivePrice: 432,
    images: [],
    soldCount: 20,
    rating: 4.5,
    isFeatured: true,
    isActive: true,
    isArchived: false,
    createdAt: "2026-05-01T00:00:00.000Z",
    searchText: "budget laptop techco affordable laptop electronics",
  },
  {
    id: "p2",
    name: "Premium Laptop",
    brand: "TechCo",
    description: "High-end laptop",
    price: 1200,
    stock: 2,
    category: "Electronics",
    condition: "NEW",
    discountPercent: null,
    effectivePrice: 1200,
    images: [],
    soldCount: 5,
    rating: 4.8,
    isFeatured: false,
    isActive: true,
    isArchived: false,
    createdAt: "2026-05-02T00:00:00.000Z",
    searchText: "premium laptop techco high-end laptop electronics",
  },
];

describe("productIndexQuery", () => {
  beforeEach(() => {
    productIndexStore.replaceAll(sampleEntries);
  });

  it("searches assistant products from the warmed index", () => {
    const results = searchAssistantProductsFromIndex("budget laptop");
    expect(results).not.toBeNull();
    expect(results?.[0]?.id).toBe("p1");
  });

  it("filters recommendations by max effective price", () => {
    const results = queryRecommendationsFromIndex("laptops under $500", {
      maxPrice: 500,
      categories: ["Electronics"],
      sortBy: "price_asc",
    });

    expect(results).not.toBeNull();
    expect(results).toHaveLength(1);
    expect(results?.[0].id).toBe("p1");
  });

  it("returns null when index is not ready", () => {
    productIndexStore.clear();
    expect(searchAssistantProductsFromIndex("laptop")).toBeNull();
    expect(
      queryRecommendationsFromIndex("laptop", { sortBy: "popular" }),
    ).toBeNull();
  });
});
