const completeChat = jest.fn();
const isAiConfigured = jest.fn();

jest.mock("../../../../config/ai", () => ({
  completeChat: (...a: unknown[]) => completeChat(...a),
  isAiConfigured: () => isAiConfigured(),
}));

import { classifyReviewsBatch } from "../ReviewThemeClassifier";

const reviews = [
  { id: "r1", rating: 1, body: "Packaging was crushed" },
  { id: "r2", rating: 5, body: "Love it" },
];

beforeEach(() => jest.clearAllMocks());

describe("classifyReviewsBatch", () => {
  it("uses rules only when AI is not configured", async () => {
    isAiConfigured.mockReturnValue(false);
    const result = await classifyReviewsBatch(reviews);
    expect(completeChat).not.toHaveBeenCalled();
    expect(result.get("r1")).toEqual({ themes: ["packaging_damage"], sentiment: "negative" });
  });

  it("merges valid AI output and ignores unknown ids, themes and sentiments", async () => {
    isAiConfigured.mockReturnValue(true);
    completeChat.mockResolvedValueOnce(
      JSON.stringify({
        reviews: [
          { id: "r2", themes: ["pricing", "made_up"], sentiment: "neutral" },
          { id: "r1", themes: ["nonsense"], sentiment: "furious" },
          { id: "ghost", themes: ["pricing"], sentiment: "positive" },
        ],
      }),
    );
    const result = await classifyReviewsBatch(reviews);
    expect(result.get("r2")).toEqual({ themes: ["pricing"], sentiment: "neutral" });
    expect(result.get("r1")).toEqual({ themes: ["packaging_damage"], sentiment: "negative" });
    expect(result.has("ghost")).toBe(false);
  });

  it("truncates review bodies sent to the model", async () => {
    isAiConfigured.mockReturnValue(true);
    completeChat.mockResolvedValueOnce(null);
    await classifyReviewsBatch([{ id: "r1", rating: 3, body: "x".repeat(900) }]);
    const payload = JSON.parse(completeChat.mock.calls[0][0].messages[1].content);
    expect(payload[0].body).toHaveLength(500);
  });

  it("falls back to rules on invalid JSON or provider errors", async () => {
    isAiConfigured.mockReturnValue(true);
    completeChat.mockResolvedValueOnce("not json");
    await expect(classifyReviewsBatch(reviews)).resolves.toHaveProperty("size", 2);
    completeChat.mockRejectedValueOnce(new Error("rate limited"));
    const result = await classifyReviewsBatch(reviews);
    expect(result.get("r2")?.sentiment).toBe("positive");
  });

  it("does not call the model for an empty batch", async () => {
    isAiConfigured.mockReturnValue(true);
    await expect(classifyReviewsBatch([])).resolves.toEqual(new Map());
    expect(completeChat).not.toHaveBeenCalled();
  });
});
