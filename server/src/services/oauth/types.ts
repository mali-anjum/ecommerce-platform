import type { OAuthProvider } from "@prisma/client";

export type OAuthProfileInput = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
  /** When false, user must complete shipping profile before checkout. */
  profileComplete?: boolean;
};

/** Normalized profile returned by each OAuth provider adapter. */
export type NormalizedOAuthProfile = {
  providerUserId: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
};

export type PendingOAuthState = {
  state: string;
  codeVerifier?: string;
};

export type OAuthCallbackRequest = {
  query: Record<string, unknown>;
  cookies: Record<string, string | undefined>;
};
