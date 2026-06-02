import { extractSearchTerms } from "../productSnippets";

describe("extractSearchTerms", () => {
  it("filters stop words and short tokens", () => {
    expect(extractSearchTerms("What is the best laptop for gaming?")).toEqual([
      "best",
      "laptop",
      "gaming",
    ]);
  });

  it("returns empty array for policy-only queries", () => {
    expect(extractSearchTerms("return policy")).toEqual([]);
  });
});
