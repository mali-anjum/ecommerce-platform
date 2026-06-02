import { Facebook } from "arctic";
import { BaseOAuthProvider } from "../internal/baseOAuthProvider";
import type { NormalizedOAuthProfile } from "../internal/types";

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

  isConfigured(): boolean {
    return Boolean(
      process.env.FACEBOOK_CLIENT_ID?.trim() &&
        process.env.FACEBOOK_CLIENT_SECRET?.trim(),
    );
  }

  private getClient(): Facebook {
    if (!this.isConfigured()) {
      throw new Error("Facebook OAuth is not configured");
    }
    const redirectUri =
      process.env.FACEBOOK_REDIRECT_URI?.trim() || this.getRedirectUri();
    return new Facebook(
      process.env.FACEBOOK_CLIENT_ID!,
      process.env.FACEBOOK_CLIENT_SECRET!,
      redirectUri,
    );
  }

  buildAuthorizationUrl(state: string): URL {
    const facebook = this.getClient();
    return facebook.createAuthorizationURL(state, ["email", "public_profile"]);
  }

  async fetchProfile(code: string): Promise<NormalizedOAuthProfile> {
    const facebook = this.getClient();
    const tokens = await facebook.validateAuthorizationCode(code);
    const profile = await this.fetchFacebookUser(tokens.accessToken());

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
