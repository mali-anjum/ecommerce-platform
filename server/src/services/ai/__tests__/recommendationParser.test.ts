import {
  isProductRecommendationQuery,
  parseRecommendationFilters,
} from "../recommendationParser";

describe("recommendationParser", () => {
  it("detects product recommendation queries", () => {
    expect(isProductRecommendationQuery("Best laptops under $500")).toBe(true);
    expect(isProductRecommendationQuery("Show me cheap sneakers")).toBe(true);
    expect(isProductRecommendationQuery("What is the return policy?")).toBe(
      false,
    );
  });

  it("parses budget and category filters", () => {
    const filters = parseRecommendationFilters("Best laptops under $500");

    expect(filters.maxPrice).toBe(500);
    expect(filters.categories).toEqual(
      expect.arrayContaining(["Electronics", "Laptops"]),
    );
    expect(filters.sortBy).toBe("popular");
  });

  it("prefers discount sort for deal-seeking queries", () => {
    const filters = parseRecommendationFilters("Cheap sneakers on sale");

    expect(filters.preferDiscount).toBe(true);
    expect(filters.sortBy).toBe("discount");
    expect(filters.categories).toEqual(expect.arrayContaining(["Fashion"]));
  });

  it("parses affordable queries as price ascending", () => {
    const filters = parseRecommendationFilters("Affordable headphones");

    expect(filters.sortBy).toBe("price_asc");
  });
});
