import {
  BANNER_IMAGE_IDS,
  PRODUCT_IMAGE_IDS,
  SUBCATEGORY_IMAGE_IDS,
  imageIdsForProduct,
  unsplashUrl,
} from "../catalogImages";
import { PRODUCT_CATEGORY_CATALOG } from "../productCategories";

const PHOTO_ID = /^\d{10,13}-[0-9a-f]{12}$/;

describe("catalogImages", () => {
  it("builds a sized Unsplash URL", () => {
    expect(unsplashUrl("1505740420928-5e560c06d30e")).toBe(
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80"
    );
    expect(unsplashUrl("1505740420928-5e560c06d30e", 1920)).toContain("w=1920");
  });

  it("has a fallback for every catalog subcategory", () => {
    for (const department of PRODUCT_CATEGORY_CATALOG) {
      for (const sub of department.subcategories) {
        expect(SUBCATEGORY_IMAGE_IDS[sub.title]?.length).toBeGreaterThan(0);
      }
    }
  });

  it("uses well-formed photo ids with at least two photos per product", () => {
    for (const [name, ids] of Object.entries(PRODUCT_IMAGE_IDS)) {
      expect({ name, count: ids.length >= 2 }).toEqual({ name, count: true });
      for (const id of ids) expect(id).toMatch(PHOTO_ID);
    }
    for (const id of BANNER_IMAGE_IDS) expect(id).toMatch(PHOTO_ID);
  });

  it("gives each product a distinct hero image", () => {
    const heroes = Object.values(PRODUCT_IMAGE_IDS).map((ids) => ids[0]);
    expect(new Set(heroes).size).toBe(heroes.length);
  });

  it("prefers the curated product entry, then the trimmed subcategory", () => {
    expect(imageIdsForProduct("Wave Buds Elite", "Audio")).toBe(PRODUCT_IMAGE_IDS["Wave Buds Elite"]);
    expect(imageIdsForProduct(" Unknown Speaker ", " Audio ")).toBe(SUBCATEGORY_IMAGE_IDS.Audio);
    expect(imageIdsForProduct("Unknown", "Garden")).toBeNull();
  });
});
