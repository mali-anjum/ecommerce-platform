import { BaseOAuthProvider } from "../internal/baseOAuthProvider";
import { buildOAuthCallbackUrl } from "../internal/oauthConfig";
import type { NormalizedOAuthProfile } from "../internal/types";
import {
  createOAuthAuthorizationUrl,
  exchangeOAuthAuthorizationCode,
} from "../internal/oauthClient";
import { z } from "zod";

const googleUserInfoSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  email_verified: z.boolean().optional(),
});

type GoogleProfile = z.infer<typeof googleUserInfoSchema>;

const GOOGLE_USERINFO_TIMEOUT_MS = 8000;

export class GoogleOAuthProvider extends BaseOAuthProvider {
  readonly provider = "GOOGLE" as const;
  readonly routeSlug = "google";
  readonly displayName = "Google";
  readonly usesPkce = true;
  readonly usesNonce = true;

  isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() &&
        process.env.GOOGLE_CLIENT_SECRET?.trim(),
    );
  }

  private getClientCredentials(): { clientId: string; clientSecret: string } {
    if (!this.isConfigured()) {
      throw new Error("Google OAuth is not configured");
    }
    return {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    };
  }

  buildAuthorizationUrl(
    state: string,
    codeVerifier?: string,
    nonce?: string,
  ): URL {
    if (!codeVerifier || !nonce) {
      throw new Error("Google OAuth requires PKCE code verifier and nonce");
    }
    const { clientId } = this.getClientCredentials();
    const url = createOAuthAuthorizationUrl({
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId,
      redirectUri: this.getRedirectUri(),
      scopes: ["openid", "profile", "email"],
      state,
      codeVerifier,
      nonce,
    });
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");
    return url;
  }

  async fetchProfile(
    code: string,
    codeVerifier?: string,
    nonce?: string,
  ): Promise<NormalizedOAuthProfile> {
    if (!codeVerifier || !nonce) {
      throw new Error("Google OAuth requires PKCE code verifier and nonce");
    }
    const { clientId, clientSecret } = this.getClientCredentials();
    const tokens = await exchangeOAuthAuthorizationCode({
      issuer: "https://accounts.google.com",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
      clientId,
      clientSecret,
      redirectUri: this.getRedirectUri(),
      code,
      codeVerifier,
      issuerAliases: ["accounts.google.com"],
      expectedNonce: nonce,
      requireIdToken: true,
    });
    const profile = await this.fetchGoogleUserInfo(tokens.accessToken);

    if (!profile.email) {
      // Do not default missing emails — it can corrupt user data and break linking.
      throw new Error("Google did not return an email address");
    }

    return {
      providerUserId: profile.sub,
      email: profile.email,
      name: profile.name ?? null,
      image: profile.picture ?? null,
      emailVerified: Boolean(profile.email_verified),
    };
  }

  private async fetchGoogleUserInfo(accessToken: string): Promise<GoogleProfile> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      GOOGLE_USERINFO_TIMEOUT_MS,
    );

    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google profile request failed (${response.status})`);
    }

    const json: unknown = await response.json();
    const parsed = googleUserInfoSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error("Google profile response was invalid");
    }
    return parsed.data;
  }
}

/** @deprecated Use GoogleOAuthProvider.getRedirectUri() */
export function getGoogleRedirectUri(): string {
  return buildOAuthCallbackUrl("google");
}

export function isGoogleConfigured(): boolean {
  return new GoogleOAuthProvider().isConfigured();
}
