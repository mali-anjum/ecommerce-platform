import {
  OAUTH_STATE_MAX_AGE_MS,
  SESSION_ACCESS_MAX_AGE_MS,
  SESSION_REFRESH_MAX_AGE_MS,
  getBaseCookieOptions,
  getClearSessionCookieOptions,
  getOAuthStateCookieOptions,
  getSessionCookieOptions,
} from "../cookies";

describe("cookies config", () => {
  const envBackup: Record<string, string | undefined> = {};

  beforeEach(() => {
    envBackup.NODE_ENV = process.env.NODE_ENV;
    envBackup.COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(envBackup)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("getBaseCookieOptions uses lax sameSite in development", () => {
    process.env.NODE_ENV = "development";
    expect(getBaseCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
  });

  it("getBaseCookieOptions uses secure none in production", () => {
    process.env.NODE_ENV = "production";
    expect(getBaseCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
  });

  it("getSessionCookieOptions omits domain in development", () => {
    process.env.NODE_ENV = "development";
    process.env.COOKIE_DOMAIN = "localhost";
    expect(getSessionCookieOptions(SESSION_ACCESS_MAX_AGE_MS)).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_ACCESS_MAX_AGE_MS,
    });
  });

  it("getSessionCookieOptions includes domain in production when set", () => {
    process.env.NODE_ENV = "production";
    process.env.COOKIE_DOMAIN = ".example.com";
    expect(getSessionCookieOptions(SESSION_REFRESH_MAX_AGE_MS)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      domain: ".example.com",
      maxAge: SESSION_REFRESH_MAX_AGE_MS,
    });
  });

  it("getOAuthStateCookieOptions never includes domain", () => {
    process.env.NODE_ENV = "production";
    process.env.COOKIE_DOMAIN = ".example.com";
    expect(getOAuthStateCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: OAUTH_STATE_MAX_AGE_MS,
    });
    expect(getOAuthStateCookieOptions()).not.toHaveProperty("domain");
  });

  it("getClearSessionCookieOptions sets maxAge 0", () => {
    process.env.NODE_ENV = "development";
    expect(getClearSessionCookieOptions()).toMatchObject({ maxAge: 0 });
  });

  it("getClearSessionCookieOptions omits domain in development", () => {
    process.env.NODE_ENV = "development";
    delete process.env.COOKIE_DOMAIN;
    expect(getClearSessionCookieOptions()).toEqual({
      ...getBaseCookieOptions(),
      maxAge: 0,
    });
  });
});
