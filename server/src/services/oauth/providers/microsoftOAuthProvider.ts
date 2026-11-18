import { BaseOAuthProvider } from "../internal/baseOAuthProvider";
import type { NormalizedOAuthProfile } from "../internal/types";
import {
  createOAuthAuthorizationUrl,
  exchangeOAuthAuthorizationCode,
} from "../internal/oauthClient";

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
  readonly usesNonce = false;

  isConfigured(): boolean {
    return Boolean(
      process.env.MICROSOFT_CLIENT_ID?.trim() &&
        process.env.MICROSOFT_CLIENT_SECRET?.trim() &&
        process.env.MICROSOFT_TENANT_ID?.trim(),
    );
  }

  private getClientCredentials(): {
    tenantId: string;
    clientId: string;
    clientSecret: string;
  } {
    if (!this.isConfigured()) {
      throw new Error("Microsoft OAuth is not configured");
    }
    return {
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    };
  }

  buildAuthorizationUrl(state: string, codeVerifier?: string): URL {
    if (!codeVerifier) {
      throw new Error("Microsoft OAuth requires PKCE code verifier");
    }
    const { tenantId, clientId } = this.getClientCredentials();
    return createOAuthAuthorizationUrl({
      authorizationEndpoint: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize`,
      clientId,
      redirectUri:
        process.env.MICROSOFT_REDIRECT_URI?.trim() || this.getRedirectUri(),
      scopes: ["openid", "profile", "email", "User.Read"],
      state,
      codeVerifier,
    });
  }

  async fetchProfile(
    code: string,
    codeVerifier?: string,
  ): Promise<NormalizedOAuthProfile> {
    if (!codeVerifier) {
      throw new Error("Microsoft OAuth requires PKCE code verifier");
    }
    const { tenantId, clientId, clientSecret } = this.getClientCredentials();
    const tokens = await exchangeOAuthAuthorizationCode({
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      tokenEndpoint: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
      clientId,
      clientSecret,
      redirectUri:
        process.env.MICROSOFT_REDIRECT_URI?.trim() || this.getRedirectUri(),
      code,
      codeVerifier,
      clientAuthentication: "basic",
    });
    const profile = await this.fetchMicrosoftUser(tokens.accessToken);

    return {
      providerUserId: profile.sub,
      email: profile.email ?? "",
      name: profile.name ?? null,
      image: profile.picture ?? null,
      // Graph `mail`/`userPrincipalName` are tenant-controlled and unverified ("nOAuth"),
      // so never let them link to an existing account by email.
      emailVerified: false,
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
