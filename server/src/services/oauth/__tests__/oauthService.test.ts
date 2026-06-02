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

import { mapProviderId } from "../internal/oauthAccountService";
import { OAuthService } from "../oauthService";
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
