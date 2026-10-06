jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("@/lib/logger", () => ({ proxyLogger: { info: jest.fn(), error: jest.fn() } }));

import { NextRequest } from "next/server";
import { POST as register } from "../register/route";
import { POST as logout } from "../logout/route";
import { GET as me } from "../me/route";
import { GET as checkSession } from "../check-session/route";
import { GET as oauthComplete } from "../oauth/complete/route";

const BACKEND = "http://backend.test";

function backend(body: unknown, status = 200, setCookies: string[] = []) {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const cookie of setCookies) headers.append("Set-Cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function req(path: string, init: { method?: string; body?: string; cookie?: string } = {}) {
  const headers = new Headers();
  if (init.cookie) headers.set("cookie", init.cookie);
  return new NextRequest(`http://localhost:3012${path}`, { method: init.method ?? "GET", body: init.body, headers });
}

describe("auth session BFF routes", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "test", DEV_URL: BACKEND };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  describe("register", () => {
    it("rejects an empty body without calling the backend", async () => {
      const res = await register(req("/api/auth/register", { method: "POST", body: "" }));
      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("forwards the body and applies auth cookies on success", async () => {
      fetchMock.mockResolvedValue(
        backend({ success: true }, 201, ["accessToken=a1; Path=/; HttpOnly", "refreshToken=r1; Path=/; HttpOnly"])
      );
      const res = await register(req("/api/auth/register", { method: "POST", body: '{"email":"a@b.co"}' }));
      expect(res.status).toBe(201);
      expect(fetchMock.mock.calls[0][1].body).toBe('{"email":"a@b.co"}');
      expect(res.cookies.get("accessToken")?.value).toBe("a1");
    });

    it.each([
      [{ error: "Email already registered" }, "Email already registered"],
      [{ message: "Password too weak" }, "Password too weak"],
      [{}, "Registration failed with status 409"],
    ])("normalizes backend error %p", async (body, message) => {
      fetchMock.mockResolvedValue(backend(body, 409));
      const res = await register(req("/api/auth/register", { method: "POST", body: "{}" }));
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ success: false, error: message });
    });

    it("explains when the backend is unreachable", async () => {
      fetchMock.mockRejectedValue(Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } }));
      const res = await register(req("/api/auth/register", { method: "POST", body: "{}" }));
      expect(res.status).toBe(503);
      expect((await res.json()).error).toMatch(/Cannot reach the authentication server/);
    });

    it("maps a timeout to 504", async () => {
      fetchMock.mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));
      expect((await register(req("/api/auth/register", { method: "POST", body: "{}" }))).status).toBe(504);
    });
  });

  describe("logout", () => {
    it("forwards the caller's cookies and passes the cookie-clearing headers back", async () => {
      fetchMock.mockResolvedValue(backend({ success: true }, 200, ["accessToken=; Max-Age=0; Path=/", "refreshToken=; Max-Age=0; Path=/"]));
      const res = await logout(req("/api/auth/logout", { method: "POST", cookie: "accessToken=a; refreshToken=r" }));
      expect(res.status).toBe(200);
      expect(fetchMock.mock.calls[0][1].headers.Cookie).toBe("accessToken=a; refreshToken=r");
      expect(res.headers.getSetCookie().join(";")).toMatch(/accessToken=;/);
    });

    it("passes backend failures and maps network errors to 503", async () => {
      fetchMock.mockResolvedValueOnce(backend({ error: "No session" }, 401));
      const failed = await logout(req("/api/auth/logout", { method: "POST" }));
      expect(failed.status).toBe(401);
      expect((await failed.json()).error).toBe("No session");

      fetchMock.mockRejectedValueOnce(new Error("down"));
      expect((await logout(req("/api/auth/logout", { method: "POST" }))).status).toBe(503);
    });
  });

  describe("me", () => {
    it("returns the current user and refreshed cookies", async () => {
      fetchMock.mockResolvedValue(backend({ success: true, user: { id: "u1" } }, 200, ["accessToken=new; Path=/"]));
      const res = await me(req("/api/auth/me", { cookie: "refreshToken=r" }));
      expect(await res.json()).toEqual({ success: true, user: { id: "u1" } });
      expect(res.cookies.get("accessToken")?.value).toBe("new");
    });

    it("passes 401 through for an inactive or signed-out user", async () => {
      fetchMock.mockResolvedValue(backend({ error: "Account is deactivated" }, 401));
      const res = await me(req("/api/auth/me"));
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe("Account is deactivated");
    });

    it("returns 500 when the backend URL is missing", async () => {
      process.env = { ...originalEnv, NODE_ENV: "test" };
      for (const key of ["DEV_URL", "DEVE_URL", "BACKEND_URL"]) Reflect.deleteProperty(process.env, key);
      expect((await me(req("/api/auth/me"))).status).toBe(500);
    });
  });

  it("check-session reports cookie presence without exposing values", async () => {
    const res = await checkSession(req("/api/auth/check-session", { cookie: "refreshToken=secret-value; theme=dark" }));
    const body = await res.json();
    expect(body).toEqual({ success: true, hasRefreshToken: true, hasAccessToken: false, cookiesPresent: ["refreshToken", "theme"] });
    expect(JSON.stringify(body)).not.toContain("secret-value");
  });

  describe("oauth complete", () => {
    const location = (res: Response) => new URL(res.headers.get("location") ?? "");

    it("redirects to login when the code is missing", async () => {
      const res = await oauthComplete(req("/api/auth/oauth/complete"));
      expect(location(res).pathname).toBe("/auth/login");
      expect(location(res).searchParams.get("oauth_error")).toMatch(/Missing/);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("exchanges the code, sets cookies and redirects to the role path on this origin", async () => {
      fetchMock.mockResolvedValue(
        backend({ success: true, redirectTo: "https://evil.example/super-admin?tab=1" }, 200, ["accessToken=a; Path=/; HttpOnly"])
      );
      const res = await oauthComplete(req("/api/auth/oauth/complete?code=a%2Bb"));
      expect(String(fetchMock.mock.calls[0][0])).toBe(`${BACKEND}/api/auth/oauth/exchange?code=a%2Bb`);
      expect(location(res).origin).toBe("http://localhost:3012");
      expect(location(res).pathname + location(res).search).toBe("/super-admin?tab=1");
      expect(res.cookies.get("accessToken")?.value).toBe("a");
    });

    it("accepts a relative redirect and defaults to /home", async () => {
      fetchMock.mockResolvedValueOnce(backend({ success: true, redirectTo: "/seller" }));
      expect(location(await oauthComplete(req("/api/auth/oauth/complete?code=x"))).pathname).toBe("/seller");
      fetchMock.mockResolvedValueOnce(backend({ success: true }));
      expect(location(await oauthComplete(req("/api/auth/oauth/complete?code=x"))).pathname).toBe("/home");
    });

    it("redirects with the backend error for an expired code", async () => {
      fetchMock.mockResolvedValue(backend({ error: "Code expired" }, 400));
      const res = await oauthComplete(req("/api/auth/oauth/complete?code=x"));
      expect(location(res).searchParams.get("oauth_error")).toBe("Code expired");
    });
  });
});
