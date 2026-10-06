import { POST } from "../route";

jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));

const TOKEN = "v".repeat(43);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3012/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/verify-email proxy", () => {
  const originalDevUrl = process.env.DEV_URL;
  const originalBackendUrl = process.env.BACKEND_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.DEV_URL = "http://localhost:4001";
  });

  afterAll(() => {
    process.env.DEV_URL = originalDevUrl;
    if (originalBackendUrl !== undefined) process.env.BACKEND_URL = originalBackendUrl;
    global.fetch = originalFetch;
  });

  it("forwards the token and passes success through", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "Your email address has been verified." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await POST(makeRequest({ token: TOKEN }) as never);

    expect(res.status).toBe(200);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:4001/api/auth/verify-email");
    expect(JSON.parse(init.body)).toEqual({ token: TOKEN });
  });

  it("returns 400 without a token", async () => {
    global.fetch = jest.fn();

    const res = await POST(makeRequest({}) as never);

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 500 when the backend URL is not configured", async () => {
    delete process.env.DEV_URL;
    delete process.env.BACKEND_URL;
    global.fetch = jest.fn();

    const res = await POST(makeRequest({ token: TOKEN }) as never);

    expect(res.status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
