import type { NextResponse } from "next/server";
import { parse as parseSetCookie } from "set-cookie-parser";
import type { Cookie } from "set-cookie-parser";
import { extractSetCookieHeaders } from "./extractSetCookieHeaders";

type SameSiteOption = "lax" | "strict" | "none";

function normalizeSameSite(value: Cookie["sameSite"]): SameSiteOption {
  if (!value) return "lax";
  const normalized = String(value).toLowerCase();
  if (normalized === "strict" || normalized === "none") {
    return normalized;
  }
  return "lax";
}

/**
 * Maps a parsed Set-Cookie to Next.js cookie options.
 * Domain is omitted so cookies bind to the Next.js host (e.g. :3012), not Express (:4001).
 */
function toNextCookieOptions(cookie: Cookie) {
  return {
    httpOnly: cookie.httpOnly ?? false,
    secure: cookie.secure ?? false,
    sameSite: normalizeSameSite(cookie.sameSite),
    path: cookie.path ?? "/",
    ...(cookie.maxAge !== undefined ? { maxAge: cookie.maxAge } : {}),
    ...(cookie.expires ? { expires: cookie.expires } : {}),
  };
}

/**
 * Re-issues backend Set-Cookie headers on the Next.js response (BFF auth proxy).
 * Uses set-cookie-parser instead of a hand-rolled parser.
 */
export function applyProxyCookies(
  response: NextResponse,
  backendRes: Response,
): number {
  const headers = extractSetCookieHeaders(backendRes);
  if (headers.length === 0) return 0;

  const parsed = parseSetCookie(headers, { decodeValues: false });
  let applied = 0;

  for (const cookie of parsed) {
    if (!cookie.name) continue;
    response.cookies.set(cookie.name, cookie.value, toNextCookieOptions(cookie));
    applied += 1;
  }

  return applied;
}
