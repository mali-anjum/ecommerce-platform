/**
 * Cross-priority verification: exercises real AI module services (not route wiring only).
 * OpenAI is mocked off so tests run without API keys.
 */

jest.mock("../../../config/ai", () => ({
  isAiConfigured: jest.fn(() => false),
  completeChat: jest.fn(),
}));

import { classifyIntent } from "../classification/IntentClassifier";
import { parseRecommendationFilters } from "../classification/parsers/RecommendationParser";
import { getProductRecommendations } from "../recommendations/ProductRecommendationService";
import { runOrderSupportChat } from "../orders/OrderSupportService";
import { generateSeoContent } from "../seo/SeoContentGeneratorService";
import { runSmartSearch, isSmartSearchQuery } from "../search/SmartSearchService";
import { classifyReviewWithRules } from "../reviews/ReviewThemeClassifier";
import { parseSmartSearchIntent } from "../search/SmartSearchIntentParser";
import { computeIntentScore } from "../sales/IntentScoringEngine";
import { analyzeBuyingIntent } from "../sales/BuyingIntentAnalyzer";
import { productIndexStore } from "../productIndex/productIndexStore";
import type { AiProductIndexEntry } from "../productIndex/types";

function makeIndexEntry(
  overrides: Partial<AiProductIndexEntry> & Pick<AiProductIndexEntry, "id" | "name">,
): AiProductIndexEntry {
  const price = overrides.price ?? 49;
  const discountPercent = overrides.discountPercent ?? null;
  const effectivePrice =
    discountPercent != null && discountPercent > 0
      ? Math.round(price * (1 - discountPercent / 100) * 100) / 100
      : price;

  return {
    brand: "razer",
    condition: "NEW",
    description: overrides.description ?? `${overrides.name} description`,
    category: overrides.category ?? "Electronics",
    price,
    discountPercent,
    stock: 10,
    soldCount: 5,
    rating: 4.2,
    images: ["https://example.com/p.jpg"],
    isActive: true,
    isArchived: false,
    isFeatured: false,
    createdAt: new Date().toISOString(),
    searchText:
      overrides.searchText ??
      `${overrides.name} gaming wireless mouse electronics`.toLowerCase(),
    effectivePrice,
    ...overrides,
  };
}

describe("AI commerce priorities — integrated module verification", () => {
  beforeAll(() => {
    productIndexStore.replaceAll([
      makeIndexEntry({
        id: "mouse-1",
        name: "Pro Gaming Mouse",
        price: 45,
        searchText: "pro gaming mouse wireless razer electronics fps",
      }),
      makeIndexEntry({
        id: "mouse-2",
        name: "Budget Office Mouse",
        price: 15,
        searchText: "budget office mouse wired electronics",
      }),
      makeIndexEntry({
        id: "laptop-1",
        name: "Student Laptop",
        price: 699,
        category: "Laptops",
        searchText: "student laptop notebook electronics",
      }),
    ]);
  });

  describe("Priority 1 — AI Sales & Lead Generation", () => {
    it("scores high intent from browsing signals", () => {
      const score = computeIntentScore({
        sessionId: "sess-1",
        viewedProductIds: ["a", "b", "c", "d", "e"],
        viewedProducts: [],
        browsingMinutes: 12,
        returnVisitDays: 3,
        cartAbandoned: true,
        cartProductIds: ["a"],
        cartAddCount: 2,
        chatCount: 1,
        hasOrderComplete: false,
        estimatedCartValue: 120,
        triggers: [],
      });
      expect(score.total).toBeGreaterThanOrEqual(60);
    });

    it("analyzes buying intent from viewed products (rules)", async () => {
      const analysis = await analyzeBuyingIntent([
        {
          id: "1",
          name: "Gaming Keyboard",
          category: "Electronics",
          brand: "razer",
          price: 80,
        },
        {
          id: "2",
          name: "Gaming Mouse",
          category: "Electronics",
          brand: "razer",
          price: 45,
        },
      ]);
      expect(analysis.intentSummary.length).toBeGreaterThan(0);
      expect(analysis.complementaryCategories.length).toBeGreaterThan(0);
    });
  });

  describe("Priority 2 — AI Product / Setup Recommendations", () => {
    it("parses budget and category from natural language", () => {
      const filters = parseRecommendationFilters(
        "best affordable laptop under $800",
      );
      expect(filters.maxPrice).toBe(800);
      expect(filters.categories?.length).toBeGreaterThan(0);
    });

    it("returns products from warmed index for recommendation query", async () => {
      const result = await getProductRecommendations("gaming mouse", {
        searchTerms: ["mouse", "gaming"],
        maxPrice: 50,
        sortBy: "price_asc",
      });
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.products.every((p) => p.effectivePrice <= 50)).toBe(true);
    });
  });

  describe("Priority 3 — AI Customer Support", () => {
    it("classifies order support intent", () => {
      const classification = classifyIntent({
        message: "Where is my order?",
      });
      expect(classification.intent).toBe("ORDER_SUPPORT");
    });

    it("returns guest auth prompt without credentials", async () => {
      const result = await runOrderSupportChat({
        message: "Where is my order?",
      });
      expect(result.intent).toBe("order_support");
      expect(result.requiresAuth).toBe(true);
      expect(result.reply).toMatch(/order/i);
    });
  });

  describe("Priority 4 — AI Review Analyzer", () => {
    it("classifies battery and packaging complaints", () => {
      const battery = classifyReviewWithRules({
        rating: 2,
        body: "Battery bad",
      });
      expect(battery.themes).toContain("battery_life");

      const packaging = classifyReviewWithRules({
        rating: 2,
        body: "Packaging damaged",
      });
      expect(packaging.themes).toContain("packaging_damage");
    });
  });

  describe("Priority 5 — AI SEO Content Generator", () => {
    it("generates title, meta, keywords, and description", async () => {
      const content = await generateSeoContent({
        productName: "Gaming Mouse",
        category: "Electronics",
      });
      expect(content.title.toLowerCase()).toContain("gaming mouse");
      expect(content.metaDescription.length).toBeGreaterThan(20);
      expect(content.keywords.length).toBeGreaterThan(0);
      expect(content.productDescription.toLowerCase()).toContain("gaming mouse");
    });
  });

  describe("Priority 6 — AI Smart Search", () => {
    it("detects natural language queries", () => {
      expect(
        isSmartSearchQuery("I need a wireless mouse under $50 for FPS games"),
      ).toBe(true);
      expect(isSmartSearchQuery("gaming mouse")).toBe(false);
    });

    it("parses intent with price and product terms", () => {
      const intent = parseSmartSearchIntent(
        "I need a wireless mouse under $50 for FPS games",
      );
      expect(intent.filters.maxPrice).toBe(50);
      expect(intent.productTerms).toEqual(
        expect.arrayContaining(["mouse", "wireless"]),
      );
    });

    it("returns ranked products under price cap", async () => {
      const result = await runSmartSearch(
        "I need a wireless mouse under $50 for FPS games",
      );
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.products[0]?.name.toLowerCase()).toMatch(/gaming|mouse/);
      expect(
        result.products.every((p) => p.effectivePrice <= 50),
      ).toBe(true);
      expect(result.intentSummary.length).toBeGreaterThan(0);
    });
  });
});
