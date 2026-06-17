import { generateSeoContent } from "../seo/SeoContentGeneratorService";

jest.mock("../../../config/ai", () => ({
  isAiConfigured: jest.fn(() => false),
  completeChat: jest.fn(),
}));

describe("generateSeoContent", () => {
  it("generates title, meta, keywords, and description from product name", async () => {
    const result = await generateSeoContent({
      productName: "Gaming Mouse",
      category: "Electronics",
      brand: "Razer",
      storeName: "Tech Store",
    });

    expect(result.title.toLowerCase()).toContain("gaming mouse");
    expect(result.metaDescription.length).toBeGreaterThan(20);
    expect(result.metaDescription.length).toBeLessThanOrEqual(160);
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords.some((k) => k.includes("gaming"))).toBe(true);
    expect(result.productDescription.toLowerCase()).toContain("gaming mouse");
  });

  it("rejects very short product names", async () => {
    await expect(
      generateSeoContent({ productName: "A" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
