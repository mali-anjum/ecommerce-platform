const STATE_MAX_AGE_MS = 10 * 60 * 1000;

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

export function buildOAuthCallbackUrl(routeSlug: string): string {
  const override = process.env[`${routeSlug.toUpperCase()}_REDIRECT_URI`]?.trim();
  if (override) return override;
  return `${getBackendPublicUrl()}/api/auth/${routeSlug}/callback`;
}

export function oauthStateCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: STATE_MAX_AGE_MS,
  };
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
