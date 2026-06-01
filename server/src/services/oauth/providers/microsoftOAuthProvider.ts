import { MicrosoftEntraId } from "arctic";
import { BaseOAuthProvider } from "../baseOAuthProvider";
import type { NormalizedOAuthProfile } from "../types";

type MicrosoftProfile = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
};

export class MicrosoftOAuthProvider extends BaseOAuthProvider {
  readonly provider = "MICROSOFT" as const;
  readonly routeSlug = "microsoft";
  readonly displayName = "Microsoft";
  readonly usesPkce = true;

  isConfigured(): boolean {
    return Boolean(
      process.env.MICROSOFT_CLIENT_ID?.trim() &&
        process.env.MICROSOFT_CLIENT_SECRET?.trim() &&
        process.env.MICROSOFT_TENANT_ID?.trim(),
    );
  }

  private getClient(): MicrosoftEntraId {
    if (!this.isConfigured()) {
      throw new Error("Microsoft OAuth is not configured");
    }
    const redirectUri =
      process.env.MICROSOFT_REDIRECT_URI?.trim() || this.getRedirectUri();
    return new MicrosoftEntraId(
      process.env.MICROSOFT_TENANT_ID!,
      process.env.MICROSOFT_CLIENT_ID!,
      process.env.MICROSOFT_CLIENT_SECRET!,
      redirectUri,
    );
  }

  buildAuthorizationUrl(state: string, codeVerifier?: string): URL {
    if (!codeVerifier) {
      throw new Error("Microsoft OAuth requires PKCE code verifier");
    }
    const microsoft = this.getClient();
    return microsoft.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "profile",
      "email",
      "User.Read",
    ]);
  }

  async fetchProfile(
    code: string,
    codeVerifier?: string,
  ): Promise<NormalizedOAuthProfile> {
    if (!codeVerifier) {
      throw new Error("Microsoft OAuth requires PKCE code verifier");
    }
    const microsoft = this.getClient();
    const tokens = await microsoft.validateAuthorizationCode(code, codeVerifier);
    const profile = await this.fetchMicrosoftUser(tokens.accessToken());

    return {
      providerUserId: profile.sub,
      email: profile.email ?? "",
      name: profile.name ?? null,
      image: profile.picture ?? null,
      emailVerified: Boolean(profile.email),
    };
  }

  private async fetchMicrosoftUser(accessToken: string): Promise<MicrosoftProfile> {
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Microsoft profile request failed (${response.status})`);
    }
    const data = (await response.json()) as {
      id: string;
      mail?: string;
      userPrincipalName?: string;
      displayName?: string;
    };
    return {
      sub: data.id,
      email: data.mail ?? data.userPrincipalName,
      name: data.displayName,
    };
  }
}

export function isMicrosoftConfigured(): boolean {
  return new MicrosoftOAuthProvider().isConfigured();
}
