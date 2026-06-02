import {
  OAUTH_STATE_MAX_AGE_MS,
  buildOAuthCallbackUrl,
  getBackendPublicUrl,
  getFrontendUrl,
  getProviderRedirectUriEnvKey,
  oauthErrorRedirect,
  oauthStateCookieOptions,
  resolvePostLoginRedirect,
} from "../oauthConfig";

describe("oauthConfig", () => {
  const envBackup: Record<string, string | undefined> = {};

  beforeEach(() => {
    envBackup.NODE_ENV = process.env.NODE_ENV;
    envBackup.FRONTEND_URL = process.env.FRONTEND_URL;
    envBackup.BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL;
    envBackup.API_PUBLIC_URL = process.env.API_PUBLIC_URL;
    envBackup.PORT = process.env.PORT;
    envBackup.GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(envBackup)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("getProviderRedirectUriEnvKey follows slug convention", () => {
    expect(getProviderRedirectUriEnvKey("google")).toBe("GOOGLE_REDIRECT_URI");
    expect(getProviderRedirectUriEnvKey("microsoft")).toBe(
      "MICROSOFT_REDIRECT_URI",
    );
  });

  it("getFrontendUrl strips trailing slash", () => {
    process.env.FRONTEND_URL = "http://localhost:3012/";
    expect(getFrontendUrl()).toBe("http://localhost:3012");
  });

  it("getBackendPublicUrl prefers BACKEND_PUBLIC_URL", () => {
    process.env.BACKEND_PUBLIC_URL = "https://api.example.com/";
    process.env.API_PUBLIC_URL = "https://ignored.example.com";
    expect(getBackendPublicUrl()).toBe("https://api.example.com");
  });

  it("buildOAuthCallbackUrl uses override env when set", () => {
    process.env.GOOGLE_REDIRECT_URI = "https://custom.example/callback";
    expect(buildOAuthCallbackUrl("google")).toBe(
      "https://custom.example/callback",
    );
  });

  it("buildOAuthCallbackUrl defaults to backend public URL", () => {
    delete process.env.GOOGLE_REDIRECT_URI;
    process.env.BACKEND_PUBLIC_URL = "http://localhost:4001";
    expect(buildOAuthCallbackUrl("google")).toBe(
      "http://localhost:4001/api/auth/google/callback",
    );
  });

  it("oauthStateCookieOptions uses lax sameSite in development", () => {
    process.env.NODE_ENV = "development";
    expect(oauthStateCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_STATE_MAX_AGE_MS,
    });
  });

  it("oauthStateCookieOptions uses secure none in production", () => {
    process.env.NODE_ENV = "production";
    expect(oauthStateCookieOptions()).toMatchObject({
      secure: true,
      sameSite: "none",
      maxAge: OAUTH_STATE_MAX_AGE_MS,
    });
  });

  it("oauthErrorRedirect encodes message for login page", () => {
    process.env.FRONTEND_URL = "http://localhost:3012";
    expect(oauthErrorRedirect("bad state")).toBe(
      "http://localhost:3012/auth/login?oauth_error=bad%20state",
    );
  });

  it("resolvePostLoginRedirect sends incomplete profiles to complete-profile", () => {
    process.env.FRONTEND_URL = "http://localhost:3012";
    expect(
      resolvePostLoginRedirect({ role: "USER", profileComplete: false }),
    ).toBe("http://localhost:3012/complete-profile");
  });

  it("resolvePostLoginRedirect maps roles to dashboards", () => {
    process.env.FRONTEND_URL = "http://localhost:3012";
    expect(resolvePostLoginRedirect({ role: "SUPER_ADMIN" })).toBe(
      "http://localhost:3012/super-admin",
    );
    expect(resolvePostLoginRedirect({ role: "SELLER" })).toBe(
      "http://localhost:3012/seller",
    );
    expect(resolvePostLoginRedirect({ role: "USER", profileComplete: true })).toBe(
      "http://localhost:3012/home",
    );
  });
});
