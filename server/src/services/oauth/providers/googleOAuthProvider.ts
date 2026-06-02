import { Google } from "arctic";
import { BaseOAuthProvider } from "../internal/baseOAuthProvider";
import { buildOAuthCallbackUrl } from "../internal/oauthConfig";
import type { NormalizedOAuthProfile } from "../internal/types";

type GoogleProfile = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

export class GoogleOAuthProvider extends BaseOAuthProvider {
  readonly provider = "GOOGLE" as const;
  readonly routeSlug = "google";
  readonly displayName = "Google";
  readonly usesPkce = true;

  isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() &&
        process.env.GOOGLE_CLIENT_SECRET?.trim(),
    );
  }

  private getClient(): Google {
    if (!this.isConfigured()) {
      throw new Error("Google OAuth is not configured");
    }
    return new Google(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      this.getRedirectUri(),
    );
  }

  buildAuthorizationUrl(state: string, codeVerifier?: string): URL {
    if (!codeVerifier) {
      throw new Error("Google OAuth requires PKCE code verifier");
    }
    const google = this.getClient();
    const url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "profile",
      "email",
    ]);
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");
    return url;
  }

  async fetchProfile(
    code: string,
    codeVerifier?: string,
  ): Promise<NormalizedOAuthProfile> {
    if (!codeVerifier) {
      throw new Error("Google OAuth requires PKCE code verifier");
    }
    const google = this.getClient();
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const profile = await this.fetchGoogleUserInfo(tokens.accessToken());

    return {
      providerUserId: profile.sub,
      email: profile.email ?? "",
      name: profile.name ?? null,
      image: profile.picture ?? null,
      emailVerified: Boolean(profile.email_verified),
    };
  }

  private async fetchGoogleUserInfo(accessToken: string): Promise<GoogleProfile> {
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) {
      throw new Error(`Google profile request failed (${response.status})`);
    }
    return response.json() as Promise<GoogleProfile>;
  }
}

/** @deprecated Use GoogleOAuthProvider.getRedirectUri() */
export function getGoogleRedirectUri(): string {
  return buildOAuthCallbackUrl("google");
}

export function isGoogleConfigured(): boolean {
  return new GoogleOAuthProvider().isConfigured();
}
