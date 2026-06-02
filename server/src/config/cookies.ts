import type { CookieOptions } from "express";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export const SESSION_ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
export const SESSION_REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Shared HttpOnly cookie flags for auth (session + OAuth state).
 * Does not include maxAge or domain — add those per use case.
 */
export function getBaseCookieOptions(): Pick<
  CookieOptions,
  "httpOnly" | "secure" | "sameSite" | "path"
> {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: isProduction() ? "none" : "lax",
    path: "/",
  };
}

/**
 * Optional `Domain` for production when frontend and API share a parent domain
 * (e.g. `.example.com` for `app.example.com` + `api.example.com`).
 *
 * Not used in local dev: the Next.js BFF re-issues cookies without Domain so they
 * bind to `localhost:3012`. Setting `COOKIE_DOMAIN=localhost` often breaks that.
 */
function getProductionCookieDomain(): string | undefined {
  if (!isProduction()) return undefined;
  const domain = process.env.COOKIE_DOMAIN?.trim();
  return domain || undefined;
}

/** Session cookies (access + refresh) set by Express. */
export function getSessionCookieOptions(maxAgeMs: number): CookieOptions {
  const domain = getProductionCookieDomain();
  return {
    ...getBaseCookieOptions(),
    ...(domain ? { domain } : {}), // merge all properties to outer object
    maxAge: maxAgeMs,
  };
}

/** Must match options used when setting cookies (clearCookie requires same path/domain). */
export function getClearSessionCookieOptions(): CookieOptions {
  const domain = getProductionCookieDomain();
  return {
    ...getBaseCookieOptions(),
    ...(domain ? { domain } : {}),
    maxAge: 0,
  };
}

/** Short-lived OAuth state/PKCE cookie (backend callback host only — never use COOKIE_DOMAIN). */
export function getOAuthStateCookieOptions(): CookieOptions {
  return {
    ...getBaseCookieOptions(),
    maxAge: OAUTH_STATE_MAX_AGE_MS,
  };
}
