import { BaseOAuthProvider } from "../internal/baseOAuthProvider";
import type { NormalizedOAuthProfile } from "../internal/types";
import {
  createOAuthAuthorizationUrl,
  exchangeOAuthAuthorizationCode,
} from "../internal/oauthClient";

type FacebookProfile = {
  id: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
};

export class FacebookOAuthProvider extends BaseOAuthProvider {
  readonly provider = "FACEBOOK" as const;
  readonly routeSlug = "facebook";
  readonly displayName = "Facebook";
  readonly usesPkce = false;
  readonly usesNonce = false;

  isConfigured(): boolean {
    return Boolean(
      process.env.FACEBOOK_CLIENT_ID?.trim() &&
        process.env.FACEBOOK_CLIENT_SECRET?.trim(),
    );
  }

  private getClientCredentials(): { clientId: string; clientSecret: string } {
    if (!this.isConfigured()) {
      throw new Error("Facebook OAuth is not configured");
    }
    return {
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    };
  }

  buildAuthorizationUrl(state: string): URL {
    const { clientId } = this.getClientCredentials();
    return createOAuthAuthorizationUrl({
      authorizationEndpoint: "https://www.facebook.com/v16.0/dialog/oauth",
      clientId,
      redirectUri:
        process.env.FACEBOOK_REDIRECT_URI?.trim() || this.getRedirectUri(),
      scopes: ["email", "public_profile"],
      state,
    });
  }

  async fetchProfile(code: string): Promise<NormalizedOAuthProfile> {
    const { clientId, clientSecret } = this.getClientCredentials();
    const tokens = await exchangeOAuthAuthorizationCode({
      issuer: "https://www.facebook.com",
      tokenEndpoint: "https://graph.facebook.com/v16.0/oauth/access_token",
      clientId,
      clientSecret,
      redirectUri:
        process.env.FACEBOOK_REDIRECT_URI?.trim() || this.getRedirectUri(),
      code,
      clientAuthentication: "post",
    });
    const profile = await this.fetchFacebookUser(tokens.accessToken);

    return {
      providerUserId: profile.id,
      email: profile.email ?? "",
      name: profile.name ?? null,
      image: profile.picture?.data?.url ?? null,
      emailVerified: Boolean(profile.email),
    };
  }

  private async fetchFacebookUser(accessToken: string): Promise<FacebookProfile> {
    const url = new URL("https://graph.facebook.com/me");
    url.searchParams.set("fields", "id,name,email,picture");
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Facebook profile request failed (${response.status})`);
    }
    return response.json() as Promise<FacebookProfile>;
  }
}

export function isFacebookConfigured(): boolean {
  return new FacebookOAuthProvider().isConfigured();
}
