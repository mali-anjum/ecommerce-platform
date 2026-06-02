import { getOAuthStateCookieOptions, OAUTH_STATE_MAX_AGE_MS } from "../../../config/cookies";

export { OAUTH_STATE_MAX_AGE_MS };

export function getFrontendUrl(): string {
  return (process.env.FRONTEND_URL ?? "http://localhost:3012").replace(/\/+$/, "");
}

export function getBackendPublicUrl(): string {
  return (
    process.env.BACKEND_PUBLIC_URL?.trim() ||
    process.env.API_PUBLIC_URL?.trim() ||
    `http://localhost:${process.env.PORT ?? 4001}`
  ).replace(/\/+$/, "");
}

/** Env key pattern: `GOOGLE_REDIRECT_URI`, `FACEBOOK_REDIRECT_URI`, etc. */
export function getProviderRedirectUriEnvKey(routeSlug: string): string {
  return `${routeSlug.trim().toUpperCase()}_REDIRECT_URI`;
}

export function buildOAuthCallbackUrl(routeSlug: string): string {
  const override = process.env[getProviderRedirectUriEnvKey(routeSlug)]?.trim();
  if (override) return override;
  return `${getBackendPublicUrl()}/api/auth/${routeSlug}/callback`;
}

/** @deprecated Use getOAuthStateCookieOptions from config/cookies */
export function oauthStateCookieOptions() {
  return getOAuthStateCookieOptions();
}

export function oauthErrorRedirect(message: string): string {
  return `${getFrontendUrl()}/auth/login?oauth_error=${encodeURIComponent(message)}`;
}

export function resolvePostLoginRedirect(user: {
  role: string;
  profileComplete?: boolean;
}): string {
  const frontend = getFrontendUrl();
  if (user.profileComplete === false) {
    return `${frontend}/complete-profile`;
  }
  if (user.role === "SUPER_ADMIN") return `${frontend}/super-admin`;
  if (user.role === "SELLER") return `${frontend}/seller`;
  return `${frontend}/home`;
}
