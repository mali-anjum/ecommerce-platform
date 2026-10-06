jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { NextRequest } from "next/server";
import { z } from "zod";
import { proxyWithAuth } from "../proxyWithAuth";
import { proxyPublicJson, readJsonBody } from "../proxyPublicJson";
import { proxyAdminAiRequest } from "../proxyAdminAiRequest";
import { sentryTracker } from "@/lib/monitoring";

const BACKEND = "http://backend.test";

function request(url: string, init: { method?: string; cookies?: Record<string, string>; body?: BodyInit; headers?: Record<string, string> } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookies) {
    headers.set("cookie", Object.entries(init.cookies).map(([k, v]) => `${k}=${v}`).join("; "));
  }
  return new NextRequest(`http://localhost:3012${url}`, { method: init.method ?? "GET", headers, body: init.body });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function abortError() {
  return Object.assign(new Error("aborted"), { name: "AbortError" });
}

describe("BFF proxy helpers", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: "test", DEV_URL: BACKEND };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  describe("proxyWithAuth", () => {
    it("returns 500 when the backend URL is not configured", async () => {
      process.env = { ...originalEnv, NODE_ENV: "test" };
      for (const key of ["DEV_URL", "DEVE_URL", "BACKEND_URL"]) Reflect.deleteProperty(process.env, key);
      const res = await proxyWithAuth(request("/api/x", { cookies: { accessToken: "a" } }), { method: "GET", backendPath: "/api/x" });
      expect(res.status).toBe(500);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns 401 without calling the backend when there is no access token", async () => {
      const res = await proxyWithAuth(request("/api/x"), { method: "GET", backendPath: "/api/x" });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ success: false, error: "Unauthorized - No access token" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("forwards cookies, method and JSON body and passes status/body through", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: false, message: "Out of stock" }, 409));
      const res = await proxyWithAuth(request("/api/cart", { cookies: { accessToken: "acc", refreshToken: "ref" } }), {
        method: "POST",
        backendPath: "/api/cart/add",
        body: { productId: "p1", quantity: 2 },
      });

      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ success: false, message: "Out of stock" });
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BACKEND}/api/cart/add`);
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify({ productId: "p1", quantity: 2 }));
      expect((init.headers as Record<string, string>).Cookie).toBe("accessToken=acc; refreshToken=ref");
    });

    it("never sends a literal 'undefined' refresh token and omits the body for GET", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true }));
      await proxyWithAuth(request("/api/x", { cookies: { accessToken: "acc" } }), { method: "GET", backendPath: "/api/x" });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect((init.headers as Record<string, string>).Cookie).toBe("accessToken=acc; refreshToken=");
      expect(init.body).toBeUndefined();
    });

    it("maps a timeout to 504 and other failures to 500 with Sentry", async () => {
      fetchMock.mockRejectedValueOnce(abortError());
      const timeout = await proxyWithAuth(request("/api/x", { cookies: { accessToken: "a" } }), { method: "GET", backendPath: "/api/x" });
      expect(timeout.status).toBe(504);

      fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
      const failed = await proxyWithAuth(request("/api/x", { cookies: { accessToken: "a" } }), { method: "GET", backendPath: "/api/x" });
      expect(failed.status).toBe(500);
      expect(await failed.json()).toEqual({ success: false, error: "Proxy request failed" });
      expect(sentryTracker).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ route: "/api/x" }));
    });
  });

  describe("proxyPublicJson", () => {
    const schema = z.object({ email: z.string().email() });

    it("rejects invalid bodies with field errors and never calls the backend", async () => {
      const res = await proxyPublicJson({ backendPath: "/api/leads", body: { email: "nope" }, schema });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.errors[0].field).toBe("email");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("forwards only the parsed data, without cookies", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true }, 201));
      const res = await proxyPublicJson({ backendPath: "/api/leads", body: { email: "a@b.co", extra: "dropped" }, schema });
      expect(res.status).toBe(201);
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect(init.body).toBe(JSON.stringify({ email: "a@b.co" }));
      expect(init.headers).toEqual({ "Content-Type": "application/json" });
    });

    it("passes a bodiless 204 through instead of failing with 502", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      const res = await proxyPublicJson({ backendPath: "/api/x", body: { email: "a@b.co" }, schema });
      expect(res.status).toBe(204);
      expect(sentryTracker).not.toHaveBeenCalled();
    });

    it("tolerates a non-JSON backend body", async () => {
      fetchMock.mockResolvedValue(new Response("<html>bad gateway</html>", { status: 502 }));
      const res = await proxyPublicJson({ backendPath: "/api/x", body: { email: "a@b.co" }, schema });
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ success: false });
    });

    it("maps timeout to 504 and network errors to 502", async () => {
      fetchMock.mockRejectedValueOnce(abortError());
      expect((await proxyPublicJson({ backendPath: "/x", body: { email: "a@b.co" }, schema })).status).toBe(504);
      fetchMock.mockRejectedValueOnce(new Error("down"));
      expect((await proxyPublicJson({ backendPath: "/x", body: { email: "a@b.co" }, schema })).status).toBe(502);
    });

    it("readJsonBody returns undefined for malformed JSON", async () => {
      await expect(readJsonBody(new Request("http://x", { method: "POST", body: "{bad" }))).resolves.toBeUndefined();
      await expect(readJsonBody(new Request("http://x", { method: "POST", body: '{"a":1}' }))).resolves.toEqual({ a: 1 });
    });
  });

  describe("proxyAdminAiRequest", () => {
    it("requires an access token", async () => {
      const res = await proxyAdminAiRequest(request("/api/admin/ai/faqs"), ["faqs"], "GET");
      expect(res.status).toBe(401);
    });

    it("forwards query string and JSON body for writes", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true }, 201));
      const req = request("/api/admin/ai/faqs?page=2", {
        method: "POST",
        cookies: { accessToken: "acc" },
        body: JSON.stringify({ q: "x" }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await proxyAdminAiRequest(req, ["faqs"], "POST");
      expect(res.status).toBe(201);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BACKEND}/api/ai/admin/faqs?page=2`);
      expect(init.body).toBe('{"q":"x"}');
      expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    });

    it.each([[["..", "..", "users"]], [["faqs", ".", "x"]]])(
      "rejects dot segments %p so they cannot traverse out of /api/ai/admin",
      async (segments) => {
        const res = await proxyAdminAiRequest(request("/x", { cookies: { accessToken: "acc" } }), segments, "GET");
        expect(res.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
      }
    );

    it("percent-encodes segments containing slashes", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true }));
      await proxyAdminAiRequest(request("/x", { cookies: { accessToken: "acc" } }), ["faqs", "a/../../b"], "GET");
      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.pathname).toBe("/api/ai/admin/faqs/a%2F..%2F..%2Fb");
    });

    it("passes non-JSON responses through as text", async () => {
      fetchMock.mockResolvedValue(new Response("csv,data", { status: 200, headers: { "Content-Type": "text/csv" } }));
      const res = await proxyAdminAiRequest(request("/x", { cookies: { accessToken: "acc" } }), ["export"], "GET");
      expect(await res.text()).toBe("csv,data");
    });

    it("maps timeout to 504 and other errors to 500", async () => {
      fetchMock.mockRejectedValueOnce(abortError());
      expect((await proxyAdminAiRequest(request("/x", { cookies: { accessToken: "a" } }), ["faqs"], "GET")).status).toBe(504);
      fetchMock.mockRejectedValueOnce(new Error("down"));
      expect((await proxyAdminAiRequest(request("/x", { cookies: { accessToken: "a" } }), ["faqs"], "GET")).status).toBe(500);
    });
  });
});
