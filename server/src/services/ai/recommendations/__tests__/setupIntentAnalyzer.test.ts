import { analyzeSetupIntent } from "../SetupIntentAnalyzer";

describe("analyzeSetupIntent", () => {
  it("suggests photography accessories for a camera anchor product", async () => {
    const result = await analyzeSetupIntent({
      anchor: {
        id: "cam-1",
        name: "Pro Mirrorless Camera",
        brand: "OpticPro",
        category: "Cameras",
        description: "4K mirrorless camera body for enthusiasts",
      },
    });

    expect(result.setupTitle.toLowerCase()).toMatch(/photography|camera|kit/);
    expect(
      result.complementaryCategories.some((category) =>
        /tripod|memory|bag|lens/i.test(category),
      ),
    ).toBe(true);
  });

  it("enriches recommendations when browsing context is provided", async () => {
    const withoutBehavior = await analyzeSetupIntent({
      anchor: {
        id: "cam-1",
        name: "Pro Mirrorless Camera",
        brand: "OpticPro",
        category: "Cameras",
        description: "4K mirrorless camera",
      },
    });

    const withBehavior = await analyzeSetupIntent({
      anchor: {
        id: "cam-1",
        name: "Pro Mirrorless Camera",
        brand: "OpticPro",
        category: "Cameras",
        description: "4K mirrorless camera",
      },
      viewedProducts: [
        {
          id: "mem-1",
          name: "128GB SD Card",
          brand: "FastMem",
          category: "Memory Cards",
          price: 49,
        },
      ],
    });

    expect(withBehavior.intentSummary).toContain("browsing");
    expect(withBehavior.complementaryCategories.length).toBeGreaterThanOrEqual(
      withoutBehavior.complementaryCategories.length,
    );
  });
});
