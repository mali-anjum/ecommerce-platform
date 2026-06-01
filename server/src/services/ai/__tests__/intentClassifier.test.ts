import { classifyIntent, mapClassifiedIntentToLegacy } from "../intentClassifier";

describe("classifyIntent", () => {
  it("classifies order support queries", () => {
    expect(classifyIntent({ message: "Where is my order?" }).intent).toBe(
      "ORDER_SUPPORT",
    );
  });

  it("classifies product search queries", () => {
    expect(classifyIntent({ message: "Best laptops under $500" }).intent).toBe(
      "PRODUCT_SEARCH",
    );
  });

  it("classifies lead capture triggers", () => {
    expect(classifyIntent({ message: "I want to buy in bulk" }).intent).toBe(
      "LEAD",
    );
  });

  it("classifies FAQ and policy questions", () => {
    expect(classifyIntent({ message: "What is your return policy?" }).intent).toBe(
      "FAQ",
    );
  });

  it("classifies active lead sessions as LEAD", () => {
    expect(
      classifyIntent({
        message: "buyer@example.com",
        leadSession: { active: true },
      }).intent,
    ).toBe("LEAD");
  });

  it("defaults to GENERAL_CHAT", () => {
    expect(classifyIntent({ message: "Hello there" }).intent).toBe(
      "GENERAL_CHAT",
    );
  });
});

describe("mapClassifiedIntentToLegacy", () => {
  it("maps product search to product_recommendation", () => {
    expect(mapClassifiedIntentToLegacy("PRODUCT_SEARCH")).toBe(
      "product_recommendation",
    );
  });
});
