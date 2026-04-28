/**
 * Serializes refresh-token requests across browser tabs.
 * Without this, two tabs can POST /refresh-token at once; rotation invalidates
 * the first refresh token in the DB and the second request returns 401 → logout.
 *
 * Uses the Web Locks API when available (Chromium, Safari 15.4+, Firefox 96+).
 */
const LOCK_NAME = "ecommerce-platform/auth-refresh";

export async function runWithRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.locks !== "undefined" &&
    typeof navigator.locks.request === "function"
  ) {
    return navigator.locks.request(LOCK_NAME, { mode: "exclusive" }, fn);
  }
  return fn();
}
