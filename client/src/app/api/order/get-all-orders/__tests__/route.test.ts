import { GET } from "../route";

describe("get-all-orders API route", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it("returns 401 when access token is missing", async () => {
    const req = {
      cookies: {
        get: () => undefined,
      },
    } as any;
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it("proxies GET request with auth cookies", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ success: true, data: [{ id: "ord-1" }] }),
    } as any);

    const req = {
      cookies: {
        get: (name: string) =>
          name === "accessToken"
            ? { value: "a1" }
            : name === "refreshToken"
            ? { value: "r1" }
            : undefined,
      },
    } as any;

    const res = await GET(req as any);
    const body = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/order/get-all-orders"),
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
