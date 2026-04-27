import { POST } from "../route";

function makeRequest(cookie = ""): Request {
  const headers = new Headers();
  if (cookie) {
    headers.set("cookie", cookie);
  }

  return new Request("http://localhost/api/auth/heartbeat", {
    method: "POST",
    headers,
  });
}

describe("auth heartbeat route", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBackendUrl = process.env.BACKEND_URL;
  const originalDeveUrl = process.env.DEVE_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.NODE_ENV = "development";
    delete process.env.BACKEND_URL;
    delete process.env.DEVE_URL;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.BACKEND_URL = originalBackendUrl;
    process.env.DEVE_URL = originalDeveUrl;
    global.fetch = originalFetch;
  });

  it("returns config error when backend URL is missing", async () => {
    const res = await POST(makeRequest() as any);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual(
      expect.objectContaining({
        success: false,
        code: "CONFIG_ERROR",
      })
    );
  });

  it("proxies backend heartbeat response", async () => {
    process.env.DEVE_URL = "http://backend.local";
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ success: true }),
      headers: { getSetCookie: () => [] },
    } as any);

    const res = await POST(makeRequest("a=b") as any);
    const body = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://backend.local/api/auth/heartbeat",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          Cookie: "a=b",
        }),
      })
    );
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
  });
});
