import { groupTopQueries } from "../aiAnalyticsUtils";

describe("groupTopQueries", () => {
  it("groups case-insensitive duplicate queries", () => {
    const result = groupTopQueries([
      { query: "Where is my order?" },
      { query: "where is my order?" },
      { query: "Cheap laptops" },
    ]);

    expect(result).toEqual([
      { query: "Where is my order?", count: 2 },
      { query: "Cheap laptops", count: 1 },
    ]);
  });

  it("respects the limit", () => {
    const rows = Array.from({ length: 15 }, (_, index) => ({
      query: `Question ${index}`,
    }));

    expect(groupTopQueries(rows, 5)).toHaveLength(5);
  });

  it("ignores blank queries", () => {
    expect(groupTopQueries([{ query: "   " }, { query: "Hello" }])).toEqual([
      { query: "Hello", count: 1 },
    ]);
  });
});
