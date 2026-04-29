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
  } as any;
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
