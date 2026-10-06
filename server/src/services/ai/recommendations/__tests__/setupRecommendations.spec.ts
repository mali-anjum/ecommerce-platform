const productFindFirst = jest.fn();
const isFeatureEnabled = jest.fn();
const collectBehaviorSignals = jest.fn();
const getProductRecommendations = jest.fn();
const analyzeSetupIntent = jest.fn();

jest.mock("../../../../lib/prisma", () => ({
  prisma: { product: { findFirst: (...a: unknown[]) => productFindFirst(...a) } },
}));
jest.mock("../../../../config/featureFlags", () => ({ isFeatureEnabled: (k: string) => isFeatureEnabled(k) }));
jest.mock("../../sales/BehaviorSignalService", () => ({
  collectBehaviorSignals: (...a: unknown[]) => collectBehaviorSignals(...a),
}));
jest.mock("../ProductRecommendationService", () => ({
  getProductRecommendations: (...a: unknown[]) => getProductRecommendations(...a),
}));
jest.mock("../SetupIntentAnalyzer", () => ({ analyzeSetupIntent: (...a: unknown[]) => analyzeSetupIntent(...a) }));

import { getSetupRecommendations } from "../SetupRecommendationService";
import { buildRecommendationReply } from "../RecommendationReply";

const anchor = { id: "p1", name: "Gaming Laptop", brand: "X", category: "Laptops", description: "" };
const rec = (id: string, extra: Record<string, unknown> = {}) => ({ id, name: `Item ${id}`, effectivePrice: 20, discountPercent: null, ...extra });

beforeEach(() => {
  jest.clearAllMocks();
  isFeatureEnabled.mockReturnValue(true);
  productFindFirst.mockResolvedValue(anchor);
  analyzeSetupIntent.mockResolvedValue({
    setupTitle: "Gaming setup",
    intentSummary: "Complete your rig",
    complementaryCategories: ["Audio"],
    themeKeywords: ["rgb"],
  });
});

describe("getSetupRecommendations", () => {
  it("returns null when the feature is off or the anchor is unavailable", async () => {
    isFeatureEnabled.mockReturnValueOnce(false);
    await expect(getSetupRecommendations({ productId: "p1" })).resolves.toBeNull();
    productFindFirst.mockResolvedValueOnce(null);
    await expect(getSetupRecommendations({ productId: "p1" })).resolves.toBeNull();
  });

  it("excludes the anchor and viewed products, capped at six", async () => {
    collectBehaviorSignals.mockResolvedValueOnce({ viewedProducts: [{ id: "p1" }, { id: "v1" }] });
    getProductRecommendations.mockResolvedValueOnce({
      products: [rec("p1"), rec("v1"), ...Array.from({ length: 8 }, (_, i) => rec(`r${i}`))],
    });
    const result = await getSetupRecommendations({ productId: "p1", sessionId: "s1", userId: "u1" });
    expect(result?.basedOn).toBe("behavior");
    expect(result?.products.map((p) => p.id)).toEqual(["r0", "r1", "r2", "r3", "r4", "r5"]);
    expect(result).toMatchObject({ setupTitle: "Gaming setup", anchorProductId: "p1", anchorProductName: "Gaming Laptop" });
  });

  it("falls back to the anchor's category", async () => {
    getProductRecommendations.mockResolvedValueOnce({ products: [] }).mockResolvedValueOnce({ products: [rec("p1"), rec("c1")] });
    const result = await getSetupRecommendations({ productId: "p1" });
    expect(getProductRecommendations.mock.calls[1]).toEqual(["Laptops", { categories: ["Laptops"], sortBy: "popular" }]);
    expect(result?.products.map((p) => p.id)).toEqual(["c1"]);
    expect(result?.basedOn).toBe("product_context");
  });

  it("returns null when nothing can be recommended", async () => {
    getProductRecommendations.mockResolvedValue({ products: [] });
    await expect(getSetupRecommendations({ productId: "p1" })).resolves.toBeNull();
  });
});

describe("buildRecommendationReply", () => {
  it("explains when nothing matched", () => {
    expect(buildRecommendationReply([], { maxPrice: 50 } as never)).toBe(
      "I could not find products matching under $50.00. Try adjusting your budget or category, or browse the full catalog.",
    );
  });

  it("summarises up to three picks with discounts", () => {
    const reply = buildRecommendationReply(
      [rec("a", { discountPercent: 10 }), rec("b"), rec("c"), rec("d")] as never,
      { categories: ["Audio", "Gaming", "Extra"], minPrice: 10, preferDiscount: true } as never,
    );
    expect(reply).toBe(
      "Here are 4 picks for Audio / Gaming, over $10.00, with deals: Item a ($20.00, 10% off); Item b ($20.00); Item c ($20.00). Tap a card below for details.",
    );
  });

  it("uses singular wording and a generic criteria label", () => {
    expect(buildRecommendationReply([rec("a")] as never, {} as never)).toBe(
      "Here is 1 pick for your criteria: Item a ($20.00). Tap a card below for details.",
    );
  });
});
