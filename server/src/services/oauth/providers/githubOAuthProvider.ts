import { GitHub } from "arctic";
import { BaseOAuthProvider } from "../internal/baseOAuthProvider";
import type { NormalizedOAuthProfile } from "../internal/types";

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

  isConfigured(): boolean {
    return Boolean(
      process.env.GITHUB_CLIENT_ID?.trim() &&
        process.env.GITHUB_CLIENT_SECRET?.trim(),
    );
  }

  private getClient(): GitHub {
    if (!this.isConfigured()) {
      throw new Error("GitHub OAuth is not configured");
    }
    const redirectUri =
      process.env.GITHUB_REDIRECT_URI?.trim() || this.getRedirectUri();
    return new GitHub(
      process.env.GITHUB_CLIENT_ID!,
      process.env.GITHUB_CLIENT_SECRET!,
      redirectUri,
    );
  }

  buildAuthorizationUrl(state: string): URL {
    const github = this.getClient();
    return github.createAuthorizationURL(state, ["read:user", "user:email"]);
  }

  async fetchProfile(code: string): Promise<NormalizedOAuthProfile> {
    const github = this.getClient();
    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();
    const profile = await this.fetchGitHubUser(accessToken);
    const email =
      profile.email ?? (await this.fetchPrimaryEmail(accessToken));

    return {
      providerUserId: String(profile.id),
      email: email ?? "",
      name: profile.name ?? profile.login,
      image: profile.avatar_url ?? null,
      emailVerified: Boolean(email),
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
