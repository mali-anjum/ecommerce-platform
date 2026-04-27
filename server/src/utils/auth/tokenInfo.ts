/**
 * Single contract for token metadata returned to the Next.js BFF / clients.
 * - Durations are in SECONDS (matches common JWT expires_in style).
 * - refreshedAt is Unix time in milliseconds.
 * - suggestedRefreshTime is SECONDS from refreshedAt when the client should refresh (80% of access TTL).
 */

export const ACCESS_TOKEN_TTL_SEC = 15 * 60;
export const REFRESH_TOKEN_TTL_SEC = 7 * 24 * 60 * 60;

export interface TokenInfoPayload {
  refreshedAt: number;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  /** Seconds after refreshedAt to proactively refresh */
  suggestedRefreshTime: number;
}

export function buildTokenInfo(refreshedAtMs: number = Date.now()): TokenInfoPayload {
  const suggestedOffsetSec = Math.floor(ACCESS_TOKEN_TTL_SEC * 0.8);
  return {
    refreshedAt: refreshedAtMs,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SEC,
    refreshTokenExpiresIn: REFRESH_TOKEN_TTL_SEC,
    suggestedRefreshTime: suggestedOffsetSec,
  };
}
