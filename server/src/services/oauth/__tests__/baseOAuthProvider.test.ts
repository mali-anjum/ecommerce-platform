import type { Response } from "express";
import { OAuth2RequestError } from "arctic";
import { BaseOAuthProvider } from "../internal/baseOAuthProvider";
import type { NormalizedOAuthProfile } from "../internal/types";

jest.mock("arctic", () => ({
  OAuth2RequestError: class OAuth2RequestError extends Error {},
  generateState: jest.fn(() => "generated-state"),
  generateCodeVerifier: jest.fn(() => "generated-verifier"),
}));

jest.mock("../internal/oauthAccountService", () => ({
  oauthAccountService: {
    findOrCreateUserFromOAuth: jest.fn().mockResolvedValue({
      userId: "user-1",
      isNewUser: false,
    }),
  },
}));

jest.mock("../../auth/tokenService", () => ({
  tokenService: {
    issueSessionForUser: jest.fn().mockResolvedValue({
      accessToken: "access-jwt",
      refreshToken: "refresh-jwt",
      user: { id: "user-1", role: "USER", profileComplete: true },
    }),
  },
}));

jest.mock("../internal/oauthExchangeStore", () => ({
  oauthExchangeStore: {
    create: jest.fn(() => "exchange-code-abc"),
  },
}));

class TestOAuthProvider extends BaseOAuthProvider {
  readonly provider = "GITHUB" as const;
  readonly routeSlug = "github";
  readonly displayName = "GitHub";
  readonly usesPkce = true;

  isConfigured(): boolean {
    return true;
  }

  buildAuthorizationUrl(state: string, codeVerifier?: string): URL {
    const url = new URL("https://example.com/oauth");
    url.searchParams.set("state", state);
    if (codeVerifier) url.searchParams.set("verifier", codeVerifier);
    return url;
  }

  async fetchProfile(): Promise<NormalizedOAuthProfile> {
    return {
      providerUserId: "gh-1",
      email: "dev@example.com",
      name: "Dev",
      emailVerified: true,
    };
  }
}

function mockResponse(): Response {
  const cookies: Record<string, string> = {};
  return {
    cookie: jest.fn((name: string, value: string) => {
      cookies[name] = value;
    }),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
    cookies,
  } as unknown as Response;
}

describe("BaseOAuthProvider", () => {
  const provider = new TestOAuthProvider();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = "http://localhost:3012";
    process.env.NODE_ENV = "test";
  });

  it("start sets state cookie and redirects to provider URL", () => {
    const res = mockResponse();
    provider.start(res);

    expect(res.cookie).toHaveBeenCalledWith(
      "oauth_github_state",
      expect.stringContaining("generated-state"),
      expect.objectContaining({ httpOnly: true, path: "/" }),
    );
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining("https://example.com/oauth"),
    );
  });

  it("handleCallback redirects to login on access_denied", async () => {
    const res = mockResponse();
    await provider.handleCallback(
      { query: { error: "access_denied" }, cookies: {} },
      res,
    );

    expect(res.clearCookie).toHaveBeenCalledWith("oauth_github_state", {
      path: "/",
    });
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining("oauth_error="),
    );
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining("GitHub%20sign-in%20was%20cancelled"),
    );
  });

  it("handleCallback rejects missing code/state/cookie", async () => {
    const res = mockResponse();
    await provider.handleCallback({ query: {}, cookies: {} }, res);

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining("Missing%20OAuth%20callback%20parameters"),
    );
  });

  it("handleCallback rejects state mismatch", async () => {
    const res = mockResponse();
    await provider.handleCallback(
      {
        query: { code: "c", state: "wrong" },
        cookies: {
          oauth_github_state: JSON.stringify({
            state: "expected",
            codeVerifier: "v",
          }),
        },
      },
      res,
    );

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining("OAuth%20state%20mismatch"),
    );
  });

  it("handleCallback completes OAuth handoff on success", async () => {
    const res = mockResponse();
    const state = "expected-state";
    await provider.handleCallback(
      {
        query: { code: "auth-code", state },
        cookies: {
          oauth_github_state: JSON.stringify({
            state,
            codeVerifier: "verifier",
          }),
        },
      },
      res,
    );

    expect(res.redirect).toHaveBeenCalledWith(
      "http://localhost:3012/api/auth/oauth/complete?code=exchange-code-abc",
    );
  });

  it("handleCallback maps OAuth2RequestError to login redirect", async () => {
    const failingProvider = new (class extends TestOAuthProvider {
      async fetchProfile(): Promise<NormalizedOAuthProfile> {
        throw new OAuth2RequestError("invalid_grant", "bad code", null, null);
      }
    })();

    const res = mockResponse();
    const state = "s";
    await failingProvider.handleCallback(
      {
        query: { code: "c", state },
        cookies: {
          oauth_github_state: JSON.stringify({ state, codeVerifier: "v" }),
        },
      },
      res,
    );

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining("oauth_error="),
    );
  });
});
