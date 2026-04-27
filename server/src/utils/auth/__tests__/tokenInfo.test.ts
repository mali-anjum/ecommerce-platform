import {
  ACCESS_TOKEN_TTL_SEC,
  buildTokenInfo,
  REFRESH_TOKEN_TTL_SEC,
} from "../tokenInfo";

describe("buildTokenInfo", () => {
  it("uses seconds for duration fields and 80% offset for suggested refresh", () => {
    const t0 = 1_700_000_000_000;
    const info = buildTokenInfo(t0);

    expect(info.refreshedAt).toBe(t0);
    expect(info.accessTokenExpiresIn).toBe(ACCESS_TOKEN_TTL_SEC);
    expect(info.refreshTokenExpiresIn).toBe(REFRESH_TOKEN_TTL_SEC);
    expect(info.suggestedRefreshTime).toBe(Math.floor(ACCESS_TOKEN_TTL_SEC * 0.8));
  });
});
