import { NextRequest } from "next/server";
import { POST } from "../route";

jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));

function makeRequest(cookie?: string): NextRequest {
  return new NextRequest("http://localhost:3012/api/auth/resend-verification", {
    method: "POST",
    headers: cookie ? { Cookie: cookie } : {},
  });
}

describe("POST /api/auth/resend-verification proxy", () => {
  const originalDevUrl = process.env.DEV_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.DEV_URL = "http://localhost:4001";
  });

  afterAll(() => {
    process.env.DEV_URL = originalDevUrl;
    global.fetch = originalFetch;
  });

  it("returns 401 without an access token and does not call the backend", async () => {
    global.fetch = jest.fn();

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("forwards the session cookies to the backend", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "Verification email sent." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await POST(makeRequest("accessToken=acc-1; refreshToken=ref-1"));

    expect(res.status).toBe(200);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:4001/api/auth/resend-verification");
    expect(init.method).toBe("POST");
    expect(init.headers.Cookie).toBe("accessToken=acc-1; refreshToken=ref-1");
  });
});
