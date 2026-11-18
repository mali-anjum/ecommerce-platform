import { generateKeyPairSync, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import {
  createOAuthAuthorizationUrl,
  exchangeOAuthAuthorizationCode,
  generateOAuthCodeVerifier,
  generateOAuthNonce,
  generateOAuthState,
  OAuthRequestError,
} from "../oauthClient";

describe("OAuth client utilities", () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("generates cryptographically random state, verifier, and nonce values", () => {
    const values = [
      generateOAuthState(),
      generateOAuthCodeVerifier(),
      generateOAuthNonce(),
    ];

    for (const value of values) {
      expect(value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
    expect(new Set(values).size).toBe(values.length);
  });

  it("creates an authorization URL with PKCE S256 and nonce", () => {
    const url = createOAuthAuthorizationUrl({
      authorizationEndpoint: "https://provider.example/authorize",
      clientId: "client-id",
      redirectUri: "https://shop.example/callback",
      scopes: ["openid", "profile"],
      state: "random-state",
      codeVerifier: "verifier-value",
      nonce: "random-nonce",
    });

    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://shop.example/callback",
    );
    expect(url.searchParams.get("scope")).toBe("openid profile");
    expect(url.searchParams.get("state")).toBe("random-state");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBe(
      "GPXfFfmq30W8w5PWMLNtzZR2q9pxnxZ4FkY2A8xIsF4",
    );
    expect(url.searchParams.get("nonce")).toBe("random-nonce");
  });

  it("exchanges an authorization code using the configured client auth and PKCE", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "access-token", token_type: "bearer" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      ),
    );

    await expect(
      exchangeOAuthAuthorizationCode({
        issuer: "https://provider.example",
        tokenEndpoint: "https://provider.example/token",
        clientId: "client-id",
        clientSecret: "client-secret",
        redirectUri: "https://shop.example/callback",
        code: "authorization-code",
        codeVerifier: "verifier-value",
        clientAuthentication: "basic",
      }),
    ).resolves.toEqual({ accessToken: "access-token" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(requestUrl).toBe("https://provider.example/token");
    expect(requestInit.method).toBe("POST");
    expect(new Headers(requestInit.headers).get("Authorization")).toMatch(
      /^Basic /,
    );
    const body = new URLSearchParams(String(requestInit.body));
    expect(body.get("code")).toBe("authorization-code");
    expect(body.get("redirect_uri")).toBe("https://shop.example/callback");
    expect(body.get("code_verifier")).toBe("verifier-value");
    const basicCredentials = Buffer.from(
      new Headers(requestInit.headers).get("Authorization")!.slice(6),
      "base64",
    ).toString();
    expect(basicCredentials).toBe("client-id:client-secret");
    expect(body.get("client_secret")).toBeNull();
  });

  it("sends client credentials in the form body for post authentication", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "access-token", token_type: "bearer" }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      ),
    );

    await exchangeOAuthAuthorizationCode({
      issuer: "https://provider.example",
      tokenEndpoint: "https://provider.example/token",
      clientId: "client-id",
      clientSecret: "client-secret",
      redirectUri: "https://shop.example/callback",
      code: "authorization-code",
    });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = new URLSearchParams(String(requestInit.body));
    expect(body.get("client_id")).toBe("client-id");
    expect(body.get("client_secret")).toBe("client-secret");
    expect(new Headers(requestInit.headers).has("Authorization")).toBe(false);
  });

  it("surfaces provider OAuth errors without losing their code", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Authorization code expired",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(
      exchangeOAuthAuthorizationCode({
        issuer: "https://provider.example",
        tokenEndpoint: "https://provider.example/token",
        clientId: "client-id",
        clientSecret: "client-secret",
        redirectUri: "https://shop.example/callback",
        code: "expired-code",
      }),
    ).rejects.toMatchObject({
      code: "invalid_grant",
      message: "Authorization code expired",
    } satisfies Partial<OAuthRequestError>);
  });

  it("verifies ID-token signature, audience, issuer, and nonce", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const publicJwk = publicKey.export({ format: "jwk" });
    const jwksUri = `https://provider.example/keys/${randomUUID()}`;
    const jwksResponse = new Response(
      JSON.stringify({
        keys: [{ ...publicJwk, kid: "test-key", kty: "RSA" }],
      }),
      { headers: { "Content-Type": "application/json" } },
    );
    const createIdToken = (nonce: string) =>
      jwt.sign(
        { nonce },
        privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
        {
          algorithm: "RS256",
          audience: "client-id",
          expiresIn: "5m",
          issuer: "https://provider.example",
          keyid: "test-key",
          subject: "provider-user",
        },
      );
    const tokenResponse = (idToken: string) =>
      new Response(
        JSON.stringify({
          access_token: "access-token",
          id_token: idToken,
          token_type: "bearer",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );

    fetchMock
      .mockResolvedValueOnce(tokenResponse(createIdToken("expected-nonce")))
      .mockResolvedValueOnce(jwksResponse)
      .mockResolvedValueOnce(tokenResponse(createIdToken("wrong-nonce")));

    await expect(
      exchangeOAuthAuthorizationCode({
        issuer: "https://provider.example",
        tokenEndpoint: "https://provider.example/token",
        jwksUri,
        clientId: "client-id",
        clientSecret: "client-secret",
        redirectUri: "https://shop.example/callback",
        code: "authorization-code",
        expectedNonce: "expected-nonce",
        requireIdToken: true,
      }),
    ).resolves.toMatchObject({
      idTokenClaims: { sub: "provider-user", nonce: "expected-nonce" },
    });

    await expect(
      exchangeOAuthAuthorizationCode({
        issuer: "https://provider.example",
        tokenEndpoint: "https://provider.example/token",
        jwksUri,
        clientId: "client-id",
        clientSecret: "client-secret",
        redirectUri: "https://shop.example/callback",
        code: "authorization-code",
        expectedNonce: "expected-nonce",
        requireIdToken: true,
      }),
    ).rejects.toThrow("OAuth provider returned an invalid ID token");
  });
});
