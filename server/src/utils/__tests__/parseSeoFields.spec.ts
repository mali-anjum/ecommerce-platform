import { parseOptionalSeoString, parseSeoKeywordsInput } from "../parseSeoFields";
import { getErrorMessage } from "../catchError";

describe("parseSeoKeywordsInput", () => {
  it("returns undefined when the field was not sent", () => {
    expect(parseSeoKeywordsInput(undefined)).toBeUndefined();
    expect(parseSeoKeywordsInput(null)).toBeUndefined();
  });

  it("splits, trims, lowercases and drops empties from a CSV string", () => {
    expect(parseSeoKeywordsInput(" Laptop, ,GAMING ,  ")).toEqual(["laptop", "gaming"]);
    expect(parseSeoKeywordsInput("   ")).toEqual([]);
  });

  it("flattens arrays that themselves contain CSV", () => {
    expect(parseSeoKeywordsInput(["A,b", " C ", 7])).toEqual(["a", "b", "c", "7"]);
  });

  it("caps the list at 20 keywords", () => {
    const many = Array.from({ length: 30 }, (_, i) => `k${i}`).join(",");
    expect(parseSeoKeywordsInput(many)).toHaveLength(20);
    expect(parseSeoKeywordsInput(many.split(","))).toHaveLength(20);
  });
});

describe("parseOptionalSeoString", () => {
  it("distinguishes not-sent, cleared, and set", () => {
    expect(parseOptionalSeoString(undefined)).toBeUndefined();
    expect(parseOptionalSeoString(null)).toBeNull();
    expect(parseOptionalSeoString("   ")).toBeNull();
    expect(parseOptionalSeoString("  Best laptop ")).toBe("Best laptop");
  });
});

describe("getErrorMessage", () => {
  it("handles Error, string and unknown values", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
    expect(getErrorMessage("plain")).toBe("plain");
    expect(getErrorMessage({ code: 1 })).toBe("Unknown error occurred");
  });
});
