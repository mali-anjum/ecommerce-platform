import {
  REFRESH_FAILURE_COOLDOWN_MS,
  isRefreshCooldownActive,
  shouldActivateRefreshFailureCooldown,
} from "../useSilentAuth";

describe("useSilentAuth refresh recovery helpers", () => {
  describe("isRefreshCooldownActive", () => {
    it("returns true when cooldown is in the future", () => {
      const now = 1_000;
      expect(isRefreshCooldownActive(now + 1, now)).toBe(true);
    });

    it("returns false when cooldown is expired", () => {
      const now = 1_000;
      expect(isRefreshCooldownActive(now, now)).toBe(false);
      expect(isRefreshCooldownActive(now - 1, now)).toBe(false);
    });
  });

  describe("shouldActivateRefreshFailureCooldown", () => {
    it("activates when repeated refresh failures occur with refresh cookie but no access token", () => {
      expect(
        shouldActivateRefreshFailureCooldown({
          retryCount: 2,
          hasRefreshToken: true,
          hasAccessToken: false,
        }),
      ).toBe(true);
    });

    it("does not activate before retry threshold", () => {
      expect(
        shouldActivateRefreshFailureCooldown({
          retryCount: 1,
          hasRefreshToken: true,
          hasAccessToken: false,
        }),
      ).toBe(false);
    });

    it("does not activate without refresh token", () => {
      expect(
        shouldActivateRefreshFailureCooldown({
          retryCount: 3,
          hasRefreshToken: false,
          hasAccessToken: false,
        }),
      ).toBe(false);
    });

    it("does not activate when access token already exists", () => {
      expect(
        shouldActivateRefreshFailureCooldown({
          retryCount: 3,
          hasRefreshToken: true,
          hasAccessToken: true,
        }),
      ).toBe(false);
    });
  });

  it("uses a stable 2 minute cooldown", () => {
    expect(REFRESH_FAILURE_COOLDOWN_MS).toBe(120_000);
  });
});
