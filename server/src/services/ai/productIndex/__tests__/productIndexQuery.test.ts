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

  describe("assistant search ranking", () => {
    const entry = (overrides: Partial<AiProductIndexEntry>): AiProductIndexEntry => ({
      ...sampleEntries[0],
      isFeatured: false,
      ...overrides,
      searchText: [overrides.name, overrides.brand, overrides.description, overrides.category]
        .join(" ")
        .toLowerCase(),
    });

    beforeEach(() => {
      productIndexStore.replaceAll([
        // Best seller, but "lamp" only appears in its description.
        entry({ id: "desc", name: "Desk Organizer", brand: "Tidy", description: "Fits under a lamp", category: "Office", soldCount: 999 }),
        entry({ id: "name", name: "Halo Floor Lamp", brand: "Halo", description: "Warm light", category: "Lighting", soldCount: 1 }),
        entry({ id: "none", name: "Chef Knife", brand: "Nova", description: "Sharp", category: "Kitchen", soldCount: 500, isFeatured: true }),
      ]);
    });

    it("ranks name matches above description-only matches, regardless of sales", () => {
      const results = searchAssistantProductsFromIndex("floor lamp", undefined, { padWithFeatured: false });
      expect(results?.map((p) => p.id)).toEqual(["name", "desc"]);
    });

    it("matches plural queries against singular product names", () => {
      const results = searchAssistantProductsFromIndex("lamps", undefined, { padWithFeatured: false });
      expect(results?.[0]?.id).toBe("name");
    });

    it("does not pad with unrelated featured products when padding is off", () => {
      const results = searchAssistantProductsFromIndex("what is your return policy", undefined, { padWithFeatured: false });
      expect(results).toEqual([]);
    });

    it("pads with featured products by default when few match", () => {
      const results = searchAssistantProductsFromIndex("hello there");
      expect(results?.[0]?.id).toBe("none");
    });
  });
});
