import {
  classifyReviewWithRules,
} from "../reviews/ReviewThemeClassifier";

describe("reviewThemeClassifier", () => {
  it("detects battery complaints", () => {
    const result = classifyReviewWithRules({
      rating: 2,
      body: "Battery bad, dies in two hours",
    });
    expect(result.themes).toContain("battery_life");
    expect(result.sentiment).toBe("negative");
  });

  it("detects packaging and delivery themes", () => {
    const packaging = classifyReviewWithRules({
      rating: 2,
      body: "Packaging damaged, box crushed",
    });
    expect(packaging.themes).toContain("packaging_damage");

    const delivery = classifyReviewWithRules({
      rating: 2,
      body: "Delivery slow, arrived late",
    });
    expect(delivery.themes).toContain("delivery_delays");
  });

  it("falls back to other for vague praise", () => {
    const result = classifyReviewWithRules({
      rating: 5,
      body: "Love it!",
    });
    expect(result.themes).toContain("other");
    expect(result.sentiment).toBe("positive");
  });
});
