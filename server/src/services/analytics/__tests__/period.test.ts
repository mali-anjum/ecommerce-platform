import {
  parseAnalyticsPeriod,
  percentChange,
  resolveAnalyticsDateRange,
} from "../period";

describe("analytics period helpers", () => {
  it("defaults invalid period to 30d", () => {
    expect(parseAnalyticsPeriod("invalid")).toBe("30d");
  });

  it("parses supported periods", () => {
    expect(parseAnalyticsPeriod("7d")).toBe("7d");
    expect(parseAnalyticsPeriod("365d")).toBe("365d");
  });

  it("builds non-overlapping previous range", () => {
    const range = resolveAnalyticsDateRange("7d");
    expect(range.start.getTime()).toBeLessThan(range.end.getTime());
    expect(range.previousEnd.getTime()).toBeLessThan(range.start.getTime());
    expect(range.previousStart.getTime()).toBeLessThan(range.previousEnd.getTime());
  });

  it("calculates percent change safely", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(10, 0)).toBe(100);
  });
});
