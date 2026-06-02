const mockCreateAuthorizationURL = jest.fn();
const mockValidateAuthorizationCode = jest.fn();
const mockAccessToken = jest.fn(() => "google-access-token");

jest.mock("arctic", () => ({
  Google: jest.fn().mockImplementation(() => ({
    createAuthorizationURL: mockCreateAuthorizationURL,
    validateAuthorizationCode: mockValidateAuthorizationCode,
  })),
  OAuth2RequestError: class OAuth2RequestError extends Error {},
  generateState: jest.fn(),
  generateCodeVerifier: jest.fn(),
}));

import { GoogleOAuthProvider } from "../providers/googleOAuthProvider";
import { buildOAuthCallbackUrl } from "../oauthConfig";

describe("GoogleOAuthProvider", () => {
  const originalId = process.env.GOOGLE_CLIENT_ID;
  const originalSecret = process.env.GOOGLE_CLIENT_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
    delete process.env.GOOGLE_REDIRECT_URI;
    process.env.BACKEND_PUBLIC_URL = "http://localhost:4001";

    mockCreateAuthorizationURL.mockReturnValue(
      new URL("https://accounts.google.com/o/oauth2/v2/auth"),
    );
    mockValidateAuthorizationCode.mockResolvedValue({
      accessToken: mockAccessToken,
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
      "requires PKCE code verifier",
    );
  });

  it("buildAuthorizationUrl sets Google OAuth params", () => {
    const provider = new GoogleOAuthProvider();
    const url = provider.buildAuthorizationUrl("state-123", "verifier-456");

    expect(mockCreateAuthorizationURL).toHaveBeenCalledWith(
      "state-123",
      "verifier-456",
      ["openid", "profile", "email"],
    );
    expect(url.searchParams.get("access_type")).toBe("online");
    expect(url.searchParams.get("prompt")).toBe("select_account");
  });

  it("fetchProfile normalizes Google userinfo", async () => {
    const provider = new GoogleOAuthProvider();
    const profile = await provider.fetchProfile("auth-code", "verifier");

    expect(mockValidateAuthorizationCode).toHaveBeenCalledWith(
      "auth-code",
      "verifier",
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: "Bearer google-access-token" } },
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
    await expect(provider.fetchProfile("code", "verifier")).rejects.toThrow(
      "Google profile request failed (401)",
    );
  });
});
