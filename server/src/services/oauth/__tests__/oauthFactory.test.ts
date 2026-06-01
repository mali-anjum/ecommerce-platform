jest.mock("arctic", () => ({
  Google: jest.fn(),
  Facebook: jest.fn(),
  GitHub: jest.fn(),
  MicrosoftEntraId: jest.fn(),
  Apple: jest.fn(),
  OAuth2RequestError: class OAuth2RequestError extends Error {},
  generateState: jest.fn(() => "state"),
  generateCodeVerifier: jest.fn(() => "verifier"),
}));

import { OAuthFactory } from "../oauthService";
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
