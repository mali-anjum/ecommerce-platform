import { POST } from "../route";

function makeRequest(cookie = ""): any {
  const headers = new Headers();
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const cookieMap = new Map<string, string>();
  if (cookie) {
    for (const part of cookie.split(";")) {
      const [name, ...rest] = part.trim().split("=");
      if (!name) continue;
      cookieMap.set(name, rest.join("="));
    }
  }

  return {
    headers,
    nextUrl: { pathname: "/api/auth/refresh-token" },
    cookies: {
      has: (name: string) => cookieMap.has(name),
      get: (name: string) =>
        cookieMap.has(name) ? { name, value: cookieMap.get(name)! } : undefined,
    },
  };
}

describe("auth refresh-token route", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBackendUrl = process.env.BACKEND_URL;
  const originalDeveUrl = process.env.DEVE_URL;
  const originalDevUrl = process.env.DEV_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.NODE_ENV = "development";
    delete process.env.BACKEND_URL;
    delete process.env.DEVE_URL;
    delete process.env.DEV_URL;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.BACKEND_URL = originalBackendUrl;
    process.env.DEVE_URL = originalDeveUrl;
    process.env.DEV_URL = originalDevUrl;
    global.fetch = originalFetch;
  });

  it("returns 401 when refresh token cookie is missing", async () => {
    process.env.DEV_URL = "http://backend.local";

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual(
      expect.objectContaining({
        success: false,
        code: "NO_REFRESH_TOKEN",
      }),
    );
  });

  it("forwards clear-cookie headers when backend rejects refresh", async () => {
    process.env.DEV_URL = "http://backend.local";

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: "Invalid refresh token" }),
      headers: {
        getSetCookie: () => [
          "accessToken=; Max-Age=0; Path=/; HttpOnly",
          "refreshToken=; Max-Age=0; Path=/; HttpOnly",
        ],
      },
    } as any);

    const res = await POST(makeRequest("refreshToken=old-token"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual(
      expect.objectContaining({
        success: false,
        code: "REFRESH_FAILED_401",
      }),
    );
    expect(res.headers.getSetCookie()).toEqual([
      "accessToken=; Max-Age=0; Path=/; HttpOnly",
      "refreshToken=; Max-Age=0; Path=/; HttpOnly",
    ]);
  });
});
