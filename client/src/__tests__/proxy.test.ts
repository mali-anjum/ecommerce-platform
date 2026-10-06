import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

jest.mock("jose", () => ({
  jwtVerify: jest.fn(),
}));

function makeRequest(pathname: string, cookies: Record<string, string> = {}) {
  return {
    url: `http://localhost:3012${pathname}`,
    nextUrl: { pathname },
    cookies: {
      get: (key: string) =>
        cookies[key] ? { value: cookies[key] } : undefined,
    },
  } as unknown as NextRequest;
}

describe("proxy auth route guards", () => {
  const originalSecret = process.env.JWT_SECRET;

  const loadProxy = async () => {
    jest.resetModules();
    return import("@/proxy");
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("allows public login route when no auth token", async () => {
    process.env.JWT_SECRET = "test-secret";
    const { proxy } = await loadProxy();
    const req = makeRequest("/auth/login");
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it("does not redirect from login route if refresh token is missing", async () => {
    process.env.JWT_SECRET = "test-secret";
    const { proxy } = await loadProxy();
    (jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: { role: "USER" },
    });

    const req = makeRequest("/auth/login", { accessToken: "access-only" });
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects protected route to login when unauthenticated", async () => {
    process.env.JWT_SECRET = "test-secret";
    const { proxy } = await loadProxy();
    const req = makeRequest("/home");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth/login");
  });

  it("allows protected route when only refresh token exists", async () => {
    process.env.JWT_SECRET = "test-secret";
    const { proxy } = await loadProxy();
    const req = makeRequest("/home", { refreshToken: "refresh-only" });
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows login route when only refresh token exists", async () => {
    process.env.JWT_SECRET = "test-secret";
    const { proxy } = await loadProxy();
    const req = makeRequest("/auth/login", { refreshToken: "refresh-only" });
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("proxy account recovery routes", () => {
  const originalSecret = process.env.JWT_SECRET;
  const recoveryRoutes = ["/auth/forgot-password", "/auth/reset-password", "/auth/verify-email"];

  const loadProxy = async () => {
    jest.resetModules();
    return import("@/proxy");
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it.each(recoveryRoutes)("allows %s without any auth cookies", async (pathname) => {
    process.env.JWT_SECRET = "test-secret";
    const { proxy } = await loadProxy();
    const res = await proxy(makeRequest(pathname));

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it.each(recoveryRoutes)("allows %s for a signed-in user (email links)", async (pathname) => {
    process.env.JWT_SECRET = "test-secret";
    const { proxy } = await loadProxy();
    (jwtVerify as jest.Mock).mockResolvedValueOnce({ payload: { role: "USER" } });
    const res = await proxy(
      makeRequest(pathname, { accessToken: "access", refreshToken: "refresh" }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it.each(recoveryRoutes)("allows %s with an invalid token instead of redirecting", async (pathname) => {
    process.env.JWT_SECRET = "test-secret";
    const { proxy } = await loadProxy();
    (jwtVerify as jest.Mock).mockRejectedValueOnce(new Error("bad signature"));
    const res = await proxy(makeRequest(pathname, { accessToken: "tampered" }));

    expect(res.headers.get("location")).toBeNull();
  });

  it("still protects non-public routes", async () => {
    process.env.JWT_SECRET = "test-secret";
    const { proxy } = await loadProxy();
    const res = await proxy(makeRequest("/account"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth/login");
  });
});
