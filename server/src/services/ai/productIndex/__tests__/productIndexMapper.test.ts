import {
  computeEffectivePrice,
  isSellableIndexEntry,
  mapProductToIndexEntry,
} from "../productIndexMapper";
import type { AiProductIndexEntry } from "../types";

const baseProduct = {
  id: "p1",
  name: "Budget Laptop",
  brand: "TechCo",
  condition: "NEW" as const,
  description: "Lightweight laptop for students",
  seoTitle: null,
  metaDescription: null,
  seoKeywords: [] as string[],
  category: "Electronics",
  gender: "Unisex",
  sizes: [],
  colors: ["Black"],
  price: 499,
  discountPercent: 10,
  dealStartsAt: null,
  dealEndsAt: null,
  stock: 5,
  soldCount: 12,
  rating: 4.2,
  images: ["https://example.com/laptop.jpg"],
  isActive: true,
  isArchived: false,
  isFeatured: true,
  sellerId: null,
  subcategoryId: null,
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
};

describe("productIndexMapper", () => {
  it("maps prisma product rows into index entries", () => {
    const entry = mapProductToIndexEntry(baseProduct);

    expect(entry.effectivePrice).toBe(449.1);
    expect(entry.searchText).toContain("budget laptop");
    expect(entry.isFeatured).toBe(true);
  });

  it("computes effective price without discount", () => {
    expect(computeEffectivePrice(100, null)).toBe(100);
    expect(computeEffectivePrice(100, 20)).toBe(80);
  });

  it("identifies sellable products", () => {
    const sellable = mapProductToIndexEntry(baseProduct);
    expect(isSellableIndexEntry(sellable)).toBe(true);

    const outOfStock: AiProductIndexEntry = {
      ...sellable,
      stock: 0,
    };
    expect(isSellableIndexEntry(outOfStock)).toBe(false);
  });
});
