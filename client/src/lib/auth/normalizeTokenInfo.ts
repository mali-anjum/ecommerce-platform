/**
 * Normalizes backend / BFF token metadata into millisecond-based client state.
 * Backend contract (see server `buildTokenInfo`): durations are in seconds;
 * `refreshedAt` is ms since epoch.
 */

export function parseRefreshedAtMs(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : Date.now();
  }
  return Date.now();
}

/** Access TTL: seconds from API → ms; already-ms legacy values (> 3600 and typical 900000) pass through */
export function accessTokenExpiresInToMs(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 15 * 60 * 1000;
  return raw <= 3600 ? raw * 1000 : raw;
}

/** Offset until proactive refresh: seconds → ms */
export function suggestedRefreshOffsetToMs(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 12 * 60 * 1000;
  return raw <= 3600 ? raw * 1000 : raw;
}

export interface NormalizedRefreshTokenInfo {
  refreshedAt: number;
  accessTokenExpiresInMs: number;
  suggestedRefreshAtMs: number;
}

export function normalizeRefreshResponseTokenInfo(raw: {
  refreshedAt?: unknown;
  accessTokenExpiresIn?: number;
  suggestedRefreshTime?: number;
}): NormalizedRefreshTokenInfo {
  const refreshedAt = parseRefreshedAtMs(raw.refreshedAt);
  const accessTokenExpiresInMs = accessTokenExpiresInToMs(
    raw.accessTokenExpiresIn ?? 900
  );
  const offsetMs = suggestedRefreshOffsetToMs(raw.suggestedRefreshTime ?? 720);
  return {
    refreshedAt,
    accessTokenExpiresInMs,
    suggestedRefreshAtMs: refreshedAt + offsetMs,
  };
}