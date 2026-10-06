import { trimText } from "../trimText";

describe("trimText", () => {
  it("trims leading and trailing whitespace from strings", () => {
    expect(trimText(" Electronics ")).toBe("Electronics");
    expect(trimText("\t MacBook Air M2\n")).toBe("MacBook Air M2");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(trimText("   ")).toBe("");
  });

  it("keeps inner spacing intact", () => {
    expect(trimText("  Home & Living  ")).toBe("Home & Living");
  });

  it("passes non-string values through unchanged", () => {
    expect(trimText(undefined)).toBeUndefined();
    expect(trimText(null)).toBeNull();
    expect(trimText(42)).toBe(42);
  });
});
