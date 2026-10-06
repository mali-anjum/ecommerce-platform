const validateAuthorizationCode = jest.fn();
const createAuthorizationURL = jest.fn();
const ctorArgs: Record<string, unknown[]> = {};

function fakeClient(name: string) {
  return jest.fn().mockImplementation((...args: unknown[]) => {
    ctorArgs[name] = args;
    return { validateAuthorizationCode, createAuthorizationURL };
  });
}

jest.mock("arctic", () => ({
  GitHub: fakeClient("GitHub"),
  Facebook: fakeClient("Facebook"),
  MicrosoftEntraId: fakeClient("MicrosoftEntraId"),
  Apple: fakeClient("Apple"),
  OAuth2RequestError: class OAuth2RequestError extends Error {},
  generateState: jest.fn(),
  generateCodeVerifier: jest.fn(),
}));

import { GitHubOAuthProvider } from "../providers/githubOAuthProvider";
import { FacebookOAuthProvider } from "../providers/facebookOAuthProvider";
import { MicrosoftOAuthProvider } from "../providers/microsoftOAuthProvider";
import { AppleOAuthProvider } from "../providers/appleOAuthProvider";

const OAUTH_ENV = [
  "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_REDIRECT_URI",
  "FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET", "FACEBOOK_REDIRECT_URI",
  "MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_TENANT_ID", "MICROSOFT_REDIRECT_URI",
  "APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY", "APPLE_PRIVATE_KEY_PATH", "APPLE_REDIRECT_URI",
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function idToken(payload: object): string {
  return `h.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.s`;
}

describe("social OAuth providers", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    validateAuthorizationCode.mockReset().mockResolvedValue({ accessToken: () => "access-1", idToken: () => null });
    createAuthorizationURL.mockReset().mockReturnValue(new URL("https://provider.example/auth"));
    process.env = { ...originalEnv, BACKEND_PUBLIC_URL: "http://localhost:4001" };
    for (const key of OAUTH_ENV) Reflect.deleteProperty(process.env, key);
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  describe("GitHub", () => {
    beforeEach(() => {
      process.env.GITHUB_CLIENT_ID = "gh-id";
      process.env.GITHUB_CLIENT_SECRET = "gh-secret";
    });

    it("is not configured without both credentials", () => {
      Reflect.deleteProperty(process.env, "GITHUB_CLIENT_SECRET");
      expect(new GitHubOAuthProvider().isConfigured()).toBe(false);
      expect(() => new GitHubOAuthProvider().buildAuthorizationUrl("s")).toThrow("GitHub OAuth is not configured");
    });

    it("requests user + email scopes", () => {
      new GitHubOAuthProvider().buildAuthorizationUrl("state-1");
      expect(createAuthorizationURL).toHaveBeenCalledWith("state-1", ["read:user", "user:email"]);
      expect(ctorArgs.GitHub[2]).toBe("http://localhost:4001/api/auth/github/callback");
    });

    it("uses the primary verified email and marks it verified", async () => {
      fetchMock
        .mockResolvedValueOnce(json({ id: 42, login: "octo", email: "public@x.io", avatar_url: "https://a/1" }))
        .mockResolvedValueOnce(
          json([
            { email: "old@x.io", primary: false, verified: true },
            { email: "main@x.io", primary: true, verified: true },
          ])
        );
      await expect(new GitHubOAuthProvider().fetchProfile("code")).resolves.toEqual({
        providerUserId: "42",
        email: "main@x.io",
        name: "octo",
        image: "https://a/1",
        emailVerified: true,
      });
      expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer access-1" });
    });

    it("does not treat an unverified public email as verified", async () => {
      fetchMock
        .mockResolvedValueOnce(json({ id: 42, login: "octo", name: "Octo", email: "victim@x.io" }))
        .mockResolvedValueOnce(json([{ email: "victim@x.io", primary: true, verified: false }]));
      const profile = await new GitHubOAuthProvider().fetchProfile("code");
      expect(profile).toMatchObject({ email: "victim@x.io", emailVerified: false, name: "Octo" });
    });

    it("returns an empty unverified email when the emails endpoint fails", async () => {
      fetchMock.mockResolvedValueOnce(json({ id: 1, login: "octo" })).mockResolvedValueOnce(json({}, 403));
      await expect(new GitHubOAuthProvider().fetchProfile("code")).resolves.toMatchObject({ email: "", emailVerified: false });
    });

    it("throws when the profile request fails", async () => {
      fetchMock.mockResolvedValueOnce(json({}, 401));
      await expect(new GitHubOAuthProvider().fetchProfile("code")).rejects.toThrow("GitHub profile request failed (401)");
    });
  });

  describe("Facebook", () => {
    beforeEach(() => {
      process.env.FACEBOOK_CLIENT_ID = "fb-id";
      process.env.FACEBOOK_CLIENT_SECRET = "fb-secret";
      process.env.FACEBOOK_REDIRECT_URI = "https://shop.example/fb/cb";
    });

    it("honours FACEBOOK_REDIRECT_URI and requests email scope", () => {
      new FacebookOAuthProvider().buildAuthorizationUrl("s");
      expect(ctorArgs.Facebook).toEqual(["fb-id", "fb-secret", "https://shop.example/fb/cb"]);
      expect(createAuthorizationURL).toHaveBeenCalledWith("s", ["email", "public_profile"]);
    });

    it("maps the Graph profile", async () => {
      fetchMock.mockResolvedValueOnce(
        json({ id: "fb1", name: "Ann", email: "ann@x.io", picture: { data: { url: "https://p/1" } } })
      );
      await expect(new FacebookOAuthProvider().fetchProfile("code")).resolves.toEqual({
        providerUserId: "fb1",
        email: "ann@x.io",
        name: "Ann",
        image: "https://p/1",
        emailVerified: true,
      });
      const url = new URL(String(fetchMock.mock.calls[0][0]));
      expect(url.searchParams.get("fields")).toBe("id,name,email,picture");
    });

    it("returns no email (unverified) when the user withheld it", async () => {
      fetchMock.mockResolvedValueOnce(json({ id: "fb1" }));
      await expect(new FacebookOAuthProvider().fetchProfile("code")).resolves.toMatchObject({
        email: "",
        emailVerified: false,
        name: null,
        image: null,
      });
    });

    it("throws when Graph fails", async () => {
      fetchMock.mockResolvedValueOnce(json({}, 500));
      await expect(new FacebookOAuthProvider().fetchProfile("code")).rejects.toThrow("Facebook profile request failed (500)");
    });
  });

  describe("Microsoft", () => {
    beforeEach(() => {
      process.env.MICROSOFT_CLIENT_ID = "ms-id";
      process.env.MICROSOFT_CLIENT_SECRET = "ms-secret";
      process.env.MICROSOFT_TENANT_ID = "common";
    });

    it("requires the tenant id to be configured", () => {
      Reflect.deleteProperty(process.env, "MICROSOFT_TENANT_ID");
      expect(new MicrosoftOAuthProvider().isConfigured()).toBe(false);
    });

    it("requires PKCE", async () => {
      expect(() => new MicrosoftOAuthProvider().buildAuthorizationUrl("s")).toThrow(/PKCE/);
      await expect(new MicrosoftOAuthProvider().fetchProfile("code")).rejects.toThrow(/PKCE/);
    });

    it("passes the verifier through and requests openid scopes", () => {
      new MicrosoftOAuthProvider().buildAuthorizationUrl("s", "verifier");
      expect(createAuthorizationURL).toHaveBeenCalledWith("s", "verifier", ["openid", "profile", "email", "User.Read"]);
      expect(ctorArgs.MicrosoftEntraId.slice(0, 3)).toEqual(["common", "ms-id", "ms-secret"]);
    });

    it("never marks the tenant-controlled mail attribute as verified (nOAuth)", async () => {
      fetchMock.mockResolvedValueOnce(json({ id: "ms1", mail: "victim@corp.com", displayName: "Eve" }));
      await expect(new MicrosoftOAuthProvider().fetchProfile("code", "verifier")).resolves.toEqual({
        providerUserId: "ms1",
        email: "victim@corp.com",
        name: "Eve",
        image: null,
        emailVerified: false,
      });
      expect(validateAuthorizationCode).toHaveBeenCalledWith("code", "verifier");
    });

    it("falls back to userPrincipalName when mail is missing", async () => {
      fetchMock.mockResolvedValueOnce(json({ id: "ms1", userPrincipalName: "eve@tenant.onmicrosoft.com" }));
      const profile = await new MicrosoftOAuthProvider().fetchProfile("code", "verifier");
      expect(profile.email).toBe("eve@tenant.onmicrosoft.com");
    });

    it("throws when Graph fails", async () => {
      fetchMock.mockResolvedValueOnce(json({}, 403));
      await expect(new MicrosoftOAuthProvider().fetchProfile("code", "v")).rejects.toThrow(
        "Microsoft profile request failed (403)"
      );
    });
  });

  describe("Apple", () => {
    beforeEach(() => {
      process.env.APPLE_CLIENT_ID = "apple-id";
      process.env.APPLE_TEAM_ID = "team";
      process.env.APPLE_KEY_ID = "key";
      process.env.APPLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----";
    });

    it("is configured with an inline key or a key path", () => {
      expect(new AppleOAuthProvider().isConfigured()).toBe(true);
      Reflect.deleteProperty(process.env, "APPLE_PRIVATE_KEY");
      expect(new AppleOAuthProvider().isConfigured()).toBe(false);
      process.env.APPLE_PRIVATE_KEY_PATH = "/keys/apple.p8";
      expect(new AppleOAuthProvider().isConfigured()).toBe(true);
      expect(() => new AppleOAuthProvider().buildAuthorizationUrl("s")).toThrow(/not implemented/);
    });

    it("decodes escaped newlines in the inline private key", () => {
      new AppleOAuthProvider().buildAuthorizationUrl("s");
      const keyBytes = ctorArgs.Apple[3] as Uint8Array;
      expect(new TextDecoder().decode(keyBytes)).toContain("\nabc\n");
    });

    it.each([
      [true, true],
      ["true", true],
      [false, false],
      ["false", false],
      [undefined, false],
    ])("maps email_verified=%p to emailVerified=%p", async (claim, expected) => {
      validateAuthorizationCode.mockResolvedValue({
        idToken: () => idToken({ sub: "apple-1", email: "a@privaterelay.appleid.com", email_verified: claim }),
      });
      await expect(new AppleOAuthProvider().fetchProfile("code")).resolves.toEqual({
        providerUserId: "apple-1",
        email: "a@privaterelay.appleid.com",
        name: null,
        image: null,
        emailVerified: expected,
      });
    });

    it("throws when Apple returns no ID token", async () => {
      await expect(new AppleOAuthProvider().fetchProfile("code")).rejects.toThrow("Apple did not return an ID token");
    });
  });
});
