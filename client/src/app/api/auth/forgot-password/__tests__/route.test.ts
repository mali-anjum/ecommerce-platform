import { POST } from "../route";

jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));

function makeRequest(body: unknown, raw = false): Request {
  return new Request("http://localhost:3012/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: "accessToken=secret-access" },
    body: raw ? String(body) : JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password proxy", () => {
  const originalDevUrl = process.env.DEV_URL;
  const originalFetch = global.fetch;
  const GENERIC = "If an account exists for that email, a password reset link has been sent.";

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.DEV_URL = "http://localhost:4001";
  });

  afterAll(() => {
    process.env.DEV_URL = originalDevUrl;
    global.fetch = originalFetch;
  });

  it("forwards the trimmed email to the backend without cookies and passes the response through", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: GENERIC, data: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await POST(makeRequest({ email: "  user@example.com " }) as never);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, message: GENERIC });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:4001/api/auth/forgot-password");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "user@example.com" });
    expect(JSON.stringify(init.headers)).not.toContain("secret-access");
  });

  it.each([
    ["invalid email", { email: "nope" }],
    ["missing email", {}],
  ])("returns 400 for %s without calling the backend", async (_label, body) => {
    global.fetch = jest.fn();

    const res = await POST(makeRequest(body) as never);

    expect(res.status).toBe(400);
    expect((await res.json()).errors[0].field).toBe("email");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    global.fetch = jest.fn();

    const res = await POST(makeRequest("{not json", true) as never);

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("passes backend rate-limit responses through", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: "Too many email requests." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await POST(makeRequest({ email: "user@example.com" }) as never);

    expect(res.status).toBe(429);
  });

  it("returns 502 when the backend is unreachable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

    const res = await POST(makeRequest({ email: "user@example.com" }) as never);

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ success: false });
  });

  it("returns 504 when the backend times out", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    global.fetch = jest.fn().mockRejectedValue(abort);

    const res = await POST(makeRequest({ email: "user@example.com" }) as never);

    expect(res.status).toBe(504);
  });
});
