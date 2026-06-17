import { analyzeBuyingIntent } from "../BuyingIntentAnalyzer";
import type { ViewedProductSummary } from "../types";

describe("analyzeBuyingIntent", () => {
  it("detects a gaming setup theme from viewed products", async () => {
    const products: ViewedProductSummary[] = [
      {
        id: "1",
        name: "Pro Gaming Mouse",
        brand: "Razer",
        category: "Gaming Peripherals",
        price: 79,
      },
      {
        id: "2",
        name: "Mechanical Keyboard",
        brand: "Keychron",
        category: "Gaming Peripherals",
        price: 129,
      },
      {
        id: "3",
        name: "27-inch Monitor",
        brand: "LG",
        category: "Monitors",
        price: 299,
      },
    ];

    const result = await analyzeBuyingIntent(products);

    expect(result.intentSummary.toLowerCase()).toContain("gaming");
    expect(result.complementaryCategories.length).toBeGreaterThan(0);
  });

  it("falls back to category interest for unknown product mixes", async () => {
    const products: ViewedProductSummary[] = [
      {
        id: "1",
        name: "Studio Lamp",
        brand: "Lux",
        category: "Home Decor",
        price: 49,
      },
      {
        id: "2",
        name: "Wall Art",
        brand: "Lux",
        category: "Home Decor",
        price: 79,
      },
    ];

    const result = await analyzeBuyingIntent(products);

    expect(result.intentSummary.toLowerCase()).toContain("home decor");
  });
});
