import {
  excerptRelevant,
  extractKeywords,
  extractSearchTerms,
  rankByScore,
  scoreFields,
  singularize,
} from "../relevance";

describe("term extraction", () => {
  it("keeps store vocabulary for FAQ/doc matching", () => {
    expect(extractKeywords("What is your return policy for international shipping?")).toEqual([
      "return",
      "policy",
      "international",
      "shipping",
    ]);
  });

  it("drops store vocabulary and filler for product matching", () => {
    expect(extractSearchTerms("Do you have any good gaming laptops in your store?")).toEqual([
      "gaming",
      "laptops",
    ]);
    expect(extractSearchTerms("what is your return policy")).toEqual([]);
  });

  it("de-duplicates and caps terms", () => {
    expect(extractKeywords("lamp lamp LAMP")).toEqual(["lamp"]);
    expect(extractKeywords("alpha bravo charlie delta echoes foxtrot golf hotel")).toHaveLength(6);
  });
});

describe("singularize", () => {
  it.each([
    ["laptops", "laptop"],
    ["watches", "watch"],
    ["boxes", "box"],
    ["dresses", "dress"],
    ["batteries", "battery"],
    ["glass", "glass"],
    ["bus", "bus"],
    ["shoes", "shoe"],
  ])("%s → %s", (input, expected) => {
    expect(singularize(input)).toBe(expected);
  });
});

describe("scoreFields", () => {
  const fields = [
    { text: "Budget Laptop", weight: 3 },
    { text: "Affordable gaming machine", weight: 1 },
  ];

  it("takes the best field weight per term and sums across terms", () => {
    expect(scoreFields(fields, ["laptop"])).toBe(3);
    expect(scoreFields(fields, ["gaming"])).toBe(1);
    expect(scoreFields(fields, ["laptop", "gaming"])).toBe(4);
    expect(scoreFields(fields, ["phone"])).toBe(0);
    expect(scoreFields(fields, [])).toBe(0);
  });

  it("matches plural query terms against singular text", () => {
    expect(scoreFields(fields, ["laptops"])).toBe(3);
  });
});

describe("rankByScore", () => {
  it("sorts by score and keeps original order for ties", () => {
    const items = ["a0", "b2", "c0", "d2", "e1"];
    const scores: Record<string, number> = { a0: 0, b2: 2, c0: 0, d2: 2, e1: 1 };
    expect(rankByScore(items, (item) => scores[item], 4)).toEqual(["b2", "d2", "e1", "a0"]);
  });
});

describe("excerptRelevant", () => {
  const doc = ["Intro about the company.", "Returns: 30 days for unused items.", "Careers and press.", "Refunds are issued to the original card."].join("\n\n");

  it("returns short content untouched", () => {
    expect(excerptRelevant("short", ["x"], 100)).toBe("short");
  });

  it("keeps only matching paragraphs, in original order, within the budget", () => {
    const excerpt = excerptRelevant(doc, ["returns", "refunds"], 80);
    expect(excerpt).toBe("Returns: 30 days for unused items.\n…\nRefunds are issued to the original card.");
    expect(excerpt).not.toContain("Careers");
  });

  it("falls back to the leading slice when nothing matches", () => {
    expect(excerptRelevant(doc, ["warranty"], 10)).toBe(`${doc.slice(0, 10)}…`);
  });
});
