import { generateCodeVerifier, generateState, Google, OAuth2RequestError } from "arctic";
import type { Response } from "express";
import { oauthAccountService } from "./oauthAccountService";
import { issueSessionForUser } from "../auth/tokenService";
import { createOAuthExchange } from "./oauthExchangeStore";

const OAUTH_STATE_COOKIE = "oauth_google_state";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

type PendingGoogleOAuth = {
  state: string;
  codeVerifier: string;
};

function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

function getGoogleRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI?.trim()) {
    return process.env.GOOGLE_REDIRECT_URI.trim();
  }
  const base =
    process.env.BACKEND_PUBLIC_URL?.trim() ||
    process.env.API_PUBLIC_URL?.trim() ||
    `http://localhost:${process.env.PORT ?? 4001}`;
  return `${base.replace(/\/+$/, "")}/api/auth/google/callback`;
}

function getFrontendUrl(): string {
  return (process.env.FRONTEND_URL ?? "http://localhost:3012").replace(/\/+$/, "");
}

function getGoogleClient(): Google {
  if (!isGoogleConfigured()) {
    throw new Error("Google OAuth is not configured");
  }
  return new Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    getGoogleRedirectUri(),
  );
}

function oauthStateCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: STATE_MAX_AGE_MS,
  };
}

export function startGoogleOAuth(res: Response): void {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const google = getGoogleClient();

  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  const payload: PendingGoogleOAuth = { state, codeVerifier };
  res.cookie(OAUTH_STATE_COOKIE, JSON.stringify(payload), oauthStateCookieOptions());
  res.redirect(url.toString());
}

type GoogleProfile = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    throw new Error(`Google profile request failed (${response.status})`);
  }
  return response.json() as Promise<GoogleProfile>;
}

function resolvePostLoginRedirect(user: {
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

function oauthErrorRedirect(message: string): string {
  return `${getFrontendUrl()}/auth/login?oauth_error=${encodeURIComponent(message)}`;
}

export async function handleGoogleOAuthCallback(
  req: { query: Record<string, unknown>; cookies: Record<string, string | undefined> },
  res: Response,
): Promise<void> {
  res.clearCookie(OAUTH_STATE_COOKIE, { path: "/" });

  const error = typeof req.query.error === "string" ? req.query.error : null;
  if (error) {
    res.redirect(oauthErrorRedirect(error === "access_denied" ? "Google sign-in was cancelled" : error));
    return;
  }

  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  const rawPending = req.cookies[OAUTH_STATE_COOKIE];

  if (!code || !state || !rawPending) {
    res.redirect(oauthErrorRedirect("Missing OAuth callback parameters"));
    return;
  }

  let pending: PendingGoogleOAuth;
  try {
    pending = JSON.parse(rawPending) as PendingGoogleOAuth;
  } catch {
    res.redirect(oauthErrorRedirect("Invalid OAuth state"));
    return;
  }

  if (pending.state !== state) {
    res.redirect(oauthErrorRedirect("OAuth state mismatch"));
    return;
  }

  try {
    const google = getGoogleClient();
    const tokens = await google.validateAuthorizationCode(code, pending.codeVerifier);
    const profile = await fetchGoogleProfile(tokens.accessToken());

    if (!profile.email) {
      res.redirect(oauthErrorRedirect("Google did not return an email address"));
      return;
    }

    const { userId } = await oauthAccountService.findOrCreateUserFromOAuth({
      provider: "GOOGLE",
      providerUserId: profile.sub,
      email: profile.email,
      name: profile.name ?? null,
      image: profile.picture ?? null,
      emailVerified: Boolean(profile.email_verified),
    });

    const session = await issueSessionForUser(userId);
    const redirectTo = resolvePostLoginRedirect(session.user);

    const exchangeCode = createOAuthExchange({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      redirectTo,
    });

    res.redirect(`${getFrontendUrl()}/api/auth/oauth/complete?code=${encodeURIComponent(exchangeCode)}`);
  } catch (err) {
    if (err instanceof OAuth2RequestError) {
      res.redirect(oauthErrorRedirect(err.message || "Google rejected the authorization request"));
      return;
    }
    console.error("Google OAuth callback error:", err);
    res.redirect(
      oauthErrorRedirect(err instanceof Error ? err.message : "Google sign-in failed"),
    );
  }
}

export { isGoogleConfigured, getGoogleRedirectUri };
