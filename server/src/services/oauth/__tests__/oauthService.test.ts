jest.mock("../internal/oauthClient", () => ({
  OAuthRequestError: class OAuthRequestError extends Error {},
  generateOAuthState: jest.fn(() => "state"),
  generateOAuthCodeVerifier: jest.fn(() => "verifier"),
  generateOAuthNonce: jest.fn(() => "nonce"),
  createOAuthAuthorizationUrl: jest.fn(),
  exchangeOAuthAuthorizationCode: jest.fn(),
}));

import { mapProviderId } from "../internal/helpers/providerId";
import { OAuthService } from "../OAuthService";
import { GoogleOAuthProvider } from "../providers/googleOAuthProvider";

describe("OAuthService", () => {
  it("returns Google provider instance for google slug", () => {
    const service = new OAuthService();
    const provider = service.getProvider("google");
    expect(provider).toBeInstanceOf(GoogleOAuthProvider);
  });

  it("lists configured providers via factory", () => {
    const service = new OAuthService();
    const originalId = process.env.GOOGLE_CLIENT_ID;
    const originalSecret = process.env.GOOGLE_CLIENT_SECRET;
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    expect(service.getConfiguredProviders()).toContain("GOOGLE");
    process.env.GOOGLE_CLIENT_ID = originalId;
    process.env.GOOGLE_CLIENT_SECRET = originalSecret;
  });
});

describe("mapProviderId", () => {
  it("maps supported provider slugs", () => {
    expect(mapProviderId("google")).toBe("GOOGLE");
    expect(mapProviderId("GITHUB")).toBe("GITHUB");
    expect(mapProviderId("microsoft")).toBe("MICROSOFT");
  });

  it("returns null for unsupported providers", () => {
    expect(mapProviderId("twitter")).toBeNull();
    expect(mapProviderId("")).toBeNull();
  });
});
