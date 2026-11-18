jest.mock("../internal/oauthClient", () => ({
  OAuthRequestError: class OAuthRequestError extends Error {},
  generateOAuthState: jest.fn(() => "state"),
  generateOAuthCodeVerifier: jest.fn(() => "verifier"),
  generateOAuthNonce: jest.fn(() => "nonce"),
  createOAuthAuthorizationUrl: jest.fn(),
  exchangeOAuthAuthorizationCode: jest.fn(),
}));

import { OAuthFactory } from "../oauthFactory";
import { GoogleOAuthProvider } from "../providers/googleOAuthProvider";

describe("OAuthFactory", () => {
  it("creates Google provider by slug", () => {
    const provider = OAuthFactory.createProvider("google");
    expect(provider).toBeInstanceOf(GoogleOAuthProvider);
    expect(provider.provider).toBe("GOOGLE");
    expect(provider.routeSlug).toBe("google");
  });

  it("throws for unsupported provider", () => {
    expect(() => OAuthFactory.createProvider("twitter")).toThrow(
      "Unsupported OAuth provider",
    );
  });

  it("returns only configured providers", () => {
    const originalGoogleId = process.env.GOOGLE_CLIENT_ID;
    const originalGoogleSecret = process.env.GOOGLE_CLIENT_SECRET;
    process.env.GOOGLE_CLIENT_ID = "";
    process.env.GOOGLE_CLIENT_SECRET = "";

    const configured = OAuthFactory.getConfiguredProviders();
    expect(configured).not.toContain("GOOGLE");

    process.env.GOOGLE_CLIENT_ID = originalGoogleId;
    process.env.GOOGLE_CLIENT_SECRET = originalGoogleSecret;
  });
});
