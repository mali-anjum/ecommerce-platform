import { BaseOAuthProvider } from "../internal/baseOAuthProvider";
import type { NormalizedOAuthProfile } from "../internal/types";
import {
  createOAuthAuthorizationUrl,
  exchangeOAuthAuthorizationCode,
} from "../internal/oauthClient";

type GitHubProfile = {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

export class GitHubOAuthProvider extends BaseOAuthProvider {
  readonly provider = "GITHUB" as const;
  readonly routeSlug = "github";
  readonly displayName = "GitHub";
  readonly usesPkce = false;
  readonly usesNonce = false;

  isConfigured(): boolean {
    return Boolean(
      process.env.GITHUB_CLIENT_ID?.trim() &&
        process.env.GITHUB_CLIENT_SECRET?.trim(),
    );
  }

  private getClientCredentials(): { clientId: string; clientSecret: string } {
    if (!this.isConfigured()) {
      throw new Error("GitHub OAuth is not configured");
    }
    return {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    };
  }

  buildAuthorizationUrl(state: string): URL {
    const { clientId } = this.getClientCredentials();
    return createOAuthAuthorizationUrl({
      authorizationEndpoint: "https://github.com/login/oauth/authorize",
      clientId,
      redirectUri:
        process.env.GITHUB_REDIRECT_URI?.trim() || this.getRedirectUri(),
      scopes: ["read:user", "user:email"],
      state,
    });
  }

  async fetchProfile(code: string): Promise<NormalizedOAuthProfile> {
    const { clientId, clientSecret } = this.getClientCredentials();
    const tokens = await exchangeOAuthAuthorizationCode({
      issuer: "https://github.com",
      tokenEndpoint: "https://github.com/login/oauth/access_token",
      clientId,
      clientSecret,
      redirectUri:
        process.env.GITHUB_REDIRECT_URI?.trim() || this.getRedirectUri(),
      code,
      clientAuthentication: "basic",
    });
    const profile = await this.fetchGitHubUser(tokens.accessToken);
    // Only an address GitHub marks verified may link to an existing account.
    const verifiedEmail = await this.fetchPrimaryEmail(tokens.accessToken);
    const email = verifiedEmail ?? profile.email ?? null;

    return {
      providerUserId: String(profile.id),
      email: email ?? "",
      name: profile.name ?? profile.login,
      image: profile.avatar_url ?? null,
      emailVerified: Boolean(verifiedEmail),
    };
  }

  private async fetchGitHubUser(accessToken: string): Promise<GitHubProfile> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub profile request failed (${response.status})`);
    }
    return response.json() as Promise<GitHubProfile>;
  }

  private async fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!response.ok) {
      return null;
    }
    const emails = (await response.json()) as GitHubEmail[];
    const primary =
      emails.find((entry) => entry.primary && entry.verified) ??
      emails.find((entry) => entry.verified);
    return primary?.email ?? null;
  }
}

export function isGitHubConfigured(): boolean {
  return new GitHubOAuthProvider().isConfigured();
}
