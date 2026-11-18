import jwt from "jsonwebtoken";
import { BaseOAuthProvider } from "../internal/baseOAuthProvider";
import type { NormalizedOAuthProfile } from "../internal/types";
import {
  createOAuthAuthorizationUrl,
  exchangeOAuthAuthorizationCode,
} from "../internal/oauthClient";

/**
 * Apple Sign In requires a PKCS8 private key (.p8) in addition to client credentials.
 * Set APPLE_PRIVATE_KEY (PEM contents) or APPLE_PRIVATE_KEY_PATH before enabling.
 */
export class AppleOAuthProvider extends BaseOAuthProvider {
  readonly provider = "APPLE" as const;
  readonly routeSlug = "apple";
  readonly displayName = "Apple";
  readonly usesPkce = false;
  readonly usesNonce = true;

  isConfigured(): boolean {
    return Boolean(
      process.env.APPLE_CLIENT_ID?.trim() &&
        process.env.APPLE_TEAM_ID?.trim() &&
        process.env.APPLE_KEY_ID?.trim() &&
        (process.env.APPLE_PRIVATE_KEY?.trim() ||
          process.env.APPLE_PRIVATE_KEY_PATH?.trim()),
    );
  }

  private getPrivateKey(): string {
    const inline = process.env.APPLE_PRIVATE_KEY?.trim();
    if (inline) {
      return inline.replace(/\\n/g, "\n");
    }
    throw new Error(
      "Apple private key loading from APPLE_PRIVATE_KEY_PATH is not implemented yet",
    );
  }

  private getClientCredentials(): {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKey: string;
    redirectUri: string;
  } {
    if (!this.isConfigured()) {
      throw new Error("Apple OAuth is not configured");
    }
    return {
      clientId: process.env.APPLE_CLIENT_ID!,
      teamId: process.env.APPLE_TEAM_ID!,
      keyId: process.env.APPLE_KEY_ID!,
      privateKey: this.getPrivateKey(),
      redirectUri:
        process.env.APPLE_REDIRECT_URI?.trim() || this.getRedirectUri(),
    };
  }

  buildAuthorizationUrl(state: string, _codeVerifier?: string, nonce?: string): URL {
    if (!nonce) {
      throw new Error("Apple OAuth requires a nonce");
    }
    const { clientId, redirectUri } = this.getClientCredentials();
    return createOAuthAuthorizationUrl({
      authorizationEndpoint: "https://appleid.apple.com/auth/authorize",
      clientId,
      redirectUri,
      scopes: ["name", "email"],
      state,
      nonce,
    });
  }

  async fetchProfile(
    code: string,
    _codeVerifier?: string,
    nonce?: string,
  ): Promise<NormalizedOAuthProfile> {
    if (!nonce) {
      throw new Error("Apple OAuth requires a nonce");
    }
    const { clientId, teamId, keyId, privateKey, redirectUri } =
      this.getClientCredentials();
    const clientSecret = jwt.sign({}, privateKey, {
      algorithm: "ES256",
      audience: "https://appleid.apple.com",
      expiresIn: "5m",
      issuer: teamId,
      keyid: keyId,
      subject: clientId,
    });
    const tokens = await exchangeOAuthAuthorizationCode({
      issuer: "https://appleid.apple.com",
      tokenEndpoint: "https://appleid.apple.com/auth/token",
      jwksUri: "https://appleid.apple.com/auth/keys",
      clientId,
      clientSecret,
      redirectUri,
      code,
      expectedNonce: nonce,
      requireIdToken: true,
    });
    const claims = tokens.idTokenClaims;
    if (!claims) {
      throw new Error("Apple did not return a valid ID token");
    }

    return {
      providerUserId: claims.sub,
      email: typeof claims.email === "string" ? claims.email : "",
      name: null,
      image: null,
      emailVerified:
        claims.email_verified === true || claims.email_verified === "true",
    };
  }
}

export function isAppleConfigured(): boolean {
  return new AppleOAuthProvider().isConfigured();
}
