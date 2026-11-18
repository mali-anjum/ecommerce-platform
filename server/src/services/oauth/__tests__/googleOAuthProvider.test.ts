const mockCreateOAuthAuthorizationUrl = jest.fn(
  (options: { authorizationEndpoint: string }) =>
    new URL(options.authorizationEndpoint),
);
const mockExchangeOAuthAuthorizationCode = jest.fn();

jest.mock("../internal/oauthClient", () => ({
  createOAuthAuthorizationUrl: mockCreateOAuthAuthorizationUrl,
  exchangeOAuthAuthorizationCode: mockExchangeOAuthAuthorizationCode,
}));

import { GoogleOAuthProvider } from "../providers/googleOAuthProvider";
import { buildOAuthCallbackUrl } from "../internal/oauthConfig";

describe("GoogleOAuthProvider", () => {
  const originalId = process.env.GOOGLE_CLIENT_ID;
  const originalSecret = process.env.GOOGLE_CLIENT_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
    delete process.env.GOOGLE_REDIRECT_URI;
    process.env.BACKEND_PUBLIC_URL = "http://localhost:4001";

    mockExchangeOAuthAuthorizationCode.mockResolvedValue({
      accessToken: "google-access-token",
      idTokenClaims: { sub: "google-sub-1" },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: "google-sub-1",
        email: "user@gmail.com",
        name: "Google User",
        picture: "https://cdn.example/avatar.png",
        email_verified: true,
      }),
    }) as jest.Mock;
  });

  afterAll(() => {
    process.env.GOOGLE_CLIENT_ID = originalId;
    process.env.GOOGLE_CLIENT_SECRET = originalSecret;
  });

  it("is configured when client id and secret exist", () => {
    expect(new GoogleOAuthProvider().isConfigured()).toBe(true);
    process.env.GOOGLE_CLIENT_ID = "";
    expect(new GoogleOAuthProvider().isConfigured()).toBe(false);
    process.env.GOOGLE_CLIENT_ID = "google-client-id";
  });

  it("uses shared oauthConfig redirect URI", () => {
    const provider = new GoogleOAuthProvider();
    expect(provider.getRedirectUri()).toBe(buildOAuthCallbackUrl("google"));
  });

  it("buildAuthorizationUrl requires PKCE verifier", () => {
    const provider = new GoogleOAuthProvider();
    expect(() => provider.buildAuthorizationUrl("state")).toThrow(
      "requires PKCE code verifier and nonce",
    );
  });

  it("buildAuthorizationUrl sets Google OAuth params", () => {
    const provider = new GoogleOAuthProvider();
    const url = provider.buildAuthorizationUrl(
      "state-123",
      "verifier-456",
      "nonce-789",
    );

    expect(mockCreateOAuthAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        clientId: "google-client-id",
        scopes: ["openid", "profile", "email"],
        state: "state-123",
        codeVerifier: "verifier-456",
        nonce: "nonce-789",
      }),
    );
    expect(url.searchParams.get("access_type")).toBe("online");
    expect(url.searchParams.get("prompt")).toBe("select_account");
  });

  it("fetchProfile normalizes Google userinfo", async () => {
    const provider = new GoogleOAuthProvider();
    const profile = await provider.fetchProfile("auth-code", "verifier", "nonce");

    expect(mockExchangeOAuthAuthorizationCode).toHaveBeenCalledWith(
      expect.objectContaining({
        issuer: "https://accounts.google.com",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
        code: "auth-code",
        codeVerifier: "verifier",
        expectedNonce: "nonce",
        requireIdToken: true,
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "https://openidconnect.googleapis.com/v1/userinfo",
      expect.objectContaining({
        headers: { Authorization: "Bearer google-access-token" },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(profile).toEqual({
      providerUserId: "google-sub-1",
      email: "user@gmail.com",
      name: "Google User",
      image: "https://cdn.example/avatar.png",
      emailVerified: true,
    });
  });

  it("fetchProfile throws when Google userinfo fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });
    const provider = new GoogleOAuthProvider();
    await expect(
      provider.fetchProfile("code", "verifier", "nonce"),
    ).rejects.toThrow("Google profile request failed (401)");
  });
});
