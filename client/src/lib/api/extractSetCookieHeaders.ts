/**
 * Reads all Set-Cookie headers from a fetch Response (Undici/Web fetch).
 * Uses getSetCookie() when available so multiple cookies are preserved.
 */
export function extractSetCookieHeaders(backendRes: Response): string[] {
  if (typeof backendRes.headers.getSetCookie !== "function") {
    return [];
  }
  const raw = backendRes.headers.getSetCookie();
  return Array.isArray(raw)
    ? raw.filter((s): s is string => typeof s === "string" && s.length > 0)
    : [];
}
