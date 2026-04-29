import { POST } from "../route";

describe("order track API route", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it("returns 400 when orderId or email is missing", async () => {
    const req = new Request("http://localhost/api/order/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "", email: "" }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual(
      expect.objectContaining({
        success: false,
      })
    );
  });

  it("proxies tracking request to backend and returns payload", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        success: true,
        data: { id: "ord-1", status: "SHIPPED" },
      }),
    } as any);

    const req = new Request("http://localhost/api/order/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "ord-1", email: "user@example.com" }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/order/track"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
    expect(res.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: "ord-1",
        }),
      })
    );
  });
});
