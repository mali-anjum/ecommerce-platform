import {
  createHash,
  createPublicKey,
  randomBytes,
  type JsonWebKey,
} from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { z } from "zod";

type AuthorizationUrlOptions = {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  codeVerifier?: string;
  nonce?: string;
};

type AuthorizationCodeOptions = {
  issuer: string;
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier?: string;
  clientAuthentication?: "basic" | "post";
  jwksUri?: string;
  audience?: string;
  issuerAliases?: string[];
  expectedNonce?: string;
  requireIdToken?: boolean;
};

type SigningJwk = JsonWebKey & { kid: string; kty: "RSA" };

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  id_token: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

const jwksSchema = z.object({
  keys: z.array(
    z.object({
      kid: z.string().min(1),
      kty: z.literal("RSA"),
      n: z.string().min(1),
      e: z.string().min(1),
      use: z.string().optional(),
      alg: z.string().optional(),
    }),
  ),
});

const jwksCache = new Map<string, { expiresAt: number; keys: SigningJwk[] }>();

export type OAuthTokenResult = {
  accessToken: string;
  idTokenClaims?: JwtPayload & { sub: string };
};

export class OAuthRequestError extends Error {
  constructor(
    readonly code: string,
    message?: string,
  ) {
    super(message || code);
    this.name = "OAuthRequestError";
  }
}

export function generateOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function generateOAuthCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function generateOAuthNonce(): string {
  return randomBytes(32).toString("base64url");
}

export function createOAuthAuthorizationUrl({
  authorizationEndpoint,
  clientId,
  redirectUri,
  scopes,
  state,
  codeVerifier,
  nonce,
}: AuthorizationUrlOptions): URL {
  const url = new URL(authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  if (scopes.length > 0) {
    url.searchParams.set("scope", scopes.join(" "));
  }
  if (codeVerifier) {
    const challenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  if (nonce) {
    url.searchParams.set("nonce", nonce);
  }

  return url;
}

export async function exchangeOAuthAuthorizationCode({
  issuer,
  tokenEndpoint,
  clientId,
  clientSecret,
  redirectUri,
  code,
  codeVerifier,
  clientAuthentication = "post",
  jwksUri,
  audience = clientId,
  issuerAliases = [],
  expectedNonce,
  requireIdToken,
}: AuthorizationCodeOptions): Promise<OAuthTokenResult> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
  }

  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  });
  if (clientAuthentication === "basic") {
    const encodedClientId = encodeFormValue(clientId);
    const encodedClientSecret = encodeFormValue(clientSecret);
    headers.set(
      "Authorization",
      `Basic ${Buffer.from(`${encodedClientId}:${encodedClientSecret}`).toString("base64")}`,
    );
  } else {
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
  }

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(10_000),
  });
  const json: unknown = await response.json().catch(() => {
    throw new Error(
      `OAuth token endpoint returned an invalid response (${response.status})`,
    );
  });
  const parsed = tokenResponseSchema.safeParse(json);

  if (
    typeof json === "object" &&
    json !== null &&
    "error" in json &&
    typeof json.error === "string"
  ) {
    const description =
      "error_description" in json && typeof json.error_description === "string"
        ? json.error_description
        : undefined;
    throw new OAuthRequestError(json.error, description);
  }

  if (!response.ok) {
    throw new Error(`OAuth token request failed (${response.status})`);
  }
  if (!parsed.success) {
    throw new Error("OAuth token endpoint returned an invalid response");
  }

  let idTokenClaims: OAuthTokenResult["idTokenClaims"];
  if (parsed.data.id_token && expectedNonce && jwksUri) {
    idTokenClaims = await verifyIdToken({
      token: parsed.data.id_token,
      jwksUri,
      issuer,
      issuerAliases,
      audience,
      expectedNonce,
    });
  } else if (requireIdToken) {
    throw new Error("OAuth provider did not return a verifiable ID token");
  }

  return {
    accessToken: parsed.data.access_token,
    ...(idTokenClaims ? { idTokenClaims } : {}),
  };
}

function encodeFormValue(value: string): string {
  return new URLSearchParams({ value }).toString().slice("value=".length);
}

async function verifyIdToken({
  token,
  jwksUri,
  issuer,
  issuerAliases,
  audience,
  expectedNonce,
}: {
  token: string;
  jwksUri: string;
  issuer: string;
  issuerAliases: string[];
  audience: string;
  expectedNonce: string;
}): Promise<JwtPayload & { sub: string }> {
  const decoded = jwt.decode(token, { complete: true });
  if (
    !decoded ||
    typeof decoded === "string" ||
    decoded.header.alg !== "RS256" ||
    typeof decoded.header.kid !== "string"
  ) {
    throw new Error("OAuth provider returned an invalid ID token");
  }

  const jwk = await getSigningJwk(jwksUri, decoded.header.kid);
  const claims = jwt.verify(token, createPublicKey({ key: jwk, format: "jwk" }), {
    algorithms: ["RS256"],
    audience,
    issuer: [issuer, ...issuerAliases],
  });
  if (
    typeof claims === "string" ||
    typeof claims.sub !== "string" ||
    claims.sub.length === 0 ||
    typeof claims.iat !== "number" ||
    typeof claims.exp !== "number" ||
    claims.nonce !== expectedNonce
  ) {
    throw new Error("OAuth provider returned an invalid ID token");
  }

  return claims as JwtPayload & { sub: string };
}

async function getSigningJwk(jwksUri: string, kid: string): Promise<SigningJwk> {
  const cached = jwksCache.get(jwksUri);
  const cachedKey =
    cached && cached.expiresAt > Date.now()
      ? cached.keys.find((key) => key.kid === kid)
      : undefined;
  if (cachedKey) return cachedKey;

  const response = await fetch(jwksUri, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`OAuth signing-key request failed (${response.status})`);
  }

  const json: unknown = await response.json().catch(() => {
    throw new Error("OAuth provider returned invalid signing keys");
  });
  const parsed = jwksSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("OAuth provider returned invalid signing keys");
  }

  const keys = parsed.data.keys
    .filter(
      (key) =>
        (key.use === undefined || key.use === "sig") &&
        (key.alg === undefined || key.alg === "RS256"),
    )
    .map((key) => key as SigningJwk);
  jwksCache.set(jwksUri, { expiresAt: Date.now() + 5 * 60_000, keys });
  const signingKey = keys.find((key) => key.kid === kid);
  if (!signingKey) {
    throw new Error("OAuth provider signing key was not found");
  }
  return signingKey;
}
