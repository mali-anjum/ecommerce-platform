import { POST } from "../route";

jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));

const TOKEN = "t".repeat(43);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3012/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/reset-password proxy", () => {
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

  it("forwards only token and password to the backend", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "Your password has been reset." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await POST(
      makeRequest({ token: TOKEN, password: "new-pass1", role: "SUPER_ADMIN" }) as never,
    );

    expect(res.status).toBe(200);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:4001/api/auth/reset-password");
    expect(JSON.parse(init.body)).toEqual({ token: TOKEN, password: "new-pass1" });
  });

  it.each([
    ["short password", { token: TOKEN, password: "123" }, "password"],
    ["missing token", { password: "new-pass1" }, "token"],
    ["short token", { token: "abc", password: "new-pass1" }, "token"],
  ])("returns 400 for %s without calling the backend", async (_label, body, field) => {
    global.fetch = jest.fn();

    const res = await POST(makeRequest(body) as never);

    expect(res.status).toBe(400);
    expect((await res.json()).errors[0].field).toBe(field);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("passes an expired-token 400 from the backend through with its message", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, message: "This reset link is invalid or has expired." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await POST(makeRequest({ token: TOKEN, password: "new-pass1" }) as never);

    expect(res.status).toBe(400);
    expect((await res.json()).message).toMatch(/invalid or has expired/);
  });
});
