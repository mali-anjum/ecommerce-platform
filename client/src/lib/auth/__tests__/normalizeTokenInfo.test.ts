import {
  accessTokenExpiresInToMs,
  normalizeRefreshResponseTokenInfo,
  parseRefreshedAtMs,
} from "../normalizeTokenInfo";

describe("normalizeTokenInfo", () => {
  it("parses ISO refreshedAt", () => {
    const ms = parseRefreshedAtMs("2026-01-01T00:00:00.000Z");
    expect(ms).toBe(Date.parse("2026-01-01T00:00:00.000Z"));
  });

  it("parses numeric refreshedAt as ms epoch", () => {
    expect(parseRefreshedAtMs(1_700_000_000_123)).toBe(1_700_000_000_123);
  });

  it("converts access TTL seconds to ms", () => {
    expect(accessTokenExpiresInToMs(900)).toBe(900_000);
  });

  it("passes through access TTL already in ms (legacy)", () => {
    expect(accessTokenExpiresInToMs(900_000)).toBe(900_000);
  });

  it("normalizes a standard backend refresh payload", () => {
    const t = 1_700_000_000_000;
    const norm = normalizeRefreshResponseTokenInfo({
      refreshedAt: t,
      accessTokenExpiresIn: 900,
      suggestedRefreshTime: 720,
    });

    expect(norm.refreshedAt).toBe(t);
    expect(norm.accessTokenExpiresInMs).toBe(900_000);
    expect(norm.suggestedRefreshAtMs).toBe(t + 720_000);
  });
});
