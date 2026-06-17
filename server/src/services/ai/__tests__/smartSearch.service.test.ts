jest.mock("../../../config/ai", () => ({
  isAiConfigured: jest.fn(() => false),
  completeChat: jest.fn(),
}));

jest.mock("../recommendations/ProductRecommendationService", () => ({
  getProductRecommendations: jest.fn(),
}));

import { getProductRecommendations } from "../recommendations/ProductRecommendationService";
import { runSmartSearch } from "../search/SmartSearchService";

const getProductRecommendationsMock = getProductRecommendations as jest.Mock;

describe("runSmartSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns ranked products with intent summary", async () => {
    getProductRecommendationsMock.mockResolvedValue({
      intent: "product_recommendation",
      filtersApplied: { maxPrice: 50 },
      products: [
        {
          id: "p1",
          name: "Pro Gaming Mouse",
          brand: "razer",
          price: 45,
          discountPercent: null,
          effectivePrice: 45,
          images: [],
          category: "Electronics",
          stock: 5,
          rating: 4.5,
        },
        {
          id: "p2",
          name: "Office Mouse",
          brand: "logitech",
          price: 20,
          discountPercent: null,
          effectivePrice: 20,
          images: [],
          category: "Electronics",
          stock: 10,
          rating: 4,
        },
      ],
    });

    const result = await runSmartSearch(
      "I need a wireless mouse under $50 for FPS games",
    );

    expect(result.intentSummary.length).toBeGreaterThan(0);
    expect(result.products[0]?.name).toContain("Gaming");
    expect(result.total).toBe(2);
  });
});
