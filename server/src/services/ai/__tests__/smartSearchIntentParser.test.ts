import {
  isSmartSearchQuery,
  parseSmartSearchIntent,
} from "../search/SmartSearchIntentParser";

describe("smartSearchIntentParser", () => {
  it("detects natural language shopping queries", () => {
    expect(
      isSmartSearchQuery(
        "I need a wireless mouse under $50 for FPS games",
      ),
    ).toBe(true);
    expect(isSmartSearchQuery("gaming mouse")).toBe(false);
  });

  it("extracts price cap, product terms, and use case", () => {
    const intent = parseSmartSearchIntent(
      "I need a wireless mouse under $50 for FPS games",
    );

    expect(intent.filters.maxPrice).toBe(50);
    expect(intent.productTerms).toEqual(
      expect.arrayContaining(["mouse", "gaming", "wireless"]),
    );
    expect(intent.useCase).toBe("FPS gaming");
    expect(intent.summary.length).toBeGreaterThan(0);
  });
});
