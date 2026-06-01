import { Apple } from "arctic";
import { BaseOAuthProvider } from "../baseOAuthProvider";
import type { NormalizedOAuthProfile } from "../types";

/**
 * Apple Sign In requires a PKCS8 private key (.p8) in addition to client credentials.
 * Set APPLE_PRIVATE_KEY (PEM contents) or APPLE_PRIVATE_KEY_PATH before enabling.
 */
export class AppleOAuthProvider extends BaseOAuthProvider {
  readonly provider = "APPLE" as const;
  readonly routeSlug = "apple";
  readonly displayName = "Apple";
  readonly usesPkce = false;

  isConfigured(): boolean {
    return Boolean(
      process.env.APPLE_CLIENT_ID?.trim() &&
        process.env.APPLE_TEAM_ID?.trim() &&
        process.env.APPLE_KEY_ID?.trim() &&
        (process.env.APPLE_PRIVATE_KEY?.trim() ||
          process.env.APPLE_PRIVATE_KEY_PATH?.trim()),
    );
  }

  private getPrivateKeyBytes(): Uint8Array {
    const inline = process.env.APPLE_PRIVATE_KEY?.trim();
    if (inline) {
      return new TextEncoder().encode(inline.replace(/\\n/g, "\n"));
    }
    throw new Error(
      "Apple private key loading from APPLE_PRIVATE_KEY_PATH is not implemented yet",
    );
  }

  private getClient(): Apple {
    if (!this.isConfigured()) {
      throw new Error("Apple OAuth is not configured");
    }
    const redirectUri =
      process.env.APPLE_REDIRECT_URI?.trim() || this.getRedirectUri();
    return new Apple(
      process.env.APPLE_CLIENT_ID!,
      process.env.APPLE_TEAM_ID!,
      process.env.APPLE_KEY_ID!,
      this.getPrivateKeyBytes(),
      redirectUri,
    );
  }

  buildAuthorizationUrl(state: string): URL {
    const apple = this.getClient();
    return apple.createAuthorizationURL(state, ["name", "email"]);
  }

  async fetchProfile(code: string): Promise<NormalizedOAuthProfile> {
    const apple = this.getClient();
    const tokens = await apple.validateAuthorizationCode(code);
    const idToken = tokens.idToken();
    if (!idToken) {
      throw new Error("Apple did not return an ID token");
    }

    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"),
    ) as {
      sub: string;
      email?: string;
      email_verified?: boolean | string;
    };

    return {
      providerUserId: payload.sub,
      email: payload.email ?? "",
      name: null,
      image: null,
      emailVerified:
        payload.email_verified === true || payload.email_verified === "true",
    };
  }
}

export function isAppleConfigured(): boolean {
  return new AppleOAuthProvider().isConfigured();
}
