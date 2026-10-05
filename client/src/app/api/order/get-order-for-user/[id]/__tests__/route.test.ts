import type { NextRequest } from "next/server";
import { API_ROUTES } from "@/lib/routes/api";
import { GET } from "../route";

function makeRequest(cookies: Record<string, string>): NextRequest {
  return {
    cookies: {
      get: (name: string) =>
        name in cookies ? { name, value: cookies[name] } : undefined,
    },
  } as unknown as NextRequest;
}

describe("get-order-for-user route", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns 401 without an access token", async () => {
    global.fetch = jest.fn();

    const res = await GET(makeRequest({}), {
      params: Promise.resolve({ id: "order-1" }),
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual(
      expect.objectContaining({ success: false }),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("reads the order id from route params and proxies to the backend", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ success: true, data: { id: "order/1" } }),
    } as unknown as Response);

    const res = await GET(
      makeRequest({ accessToken: "access", refreshToken: "refresh" }),
      { params: Promise.resolve({ id: "order/1" }) },
    );

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_ROUTES.ORDER}/order%2F1`,
      expect.objectContaining({ method: "GET" }),
    );
  });
});
