jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("@/lib/feature-flags", () => ({ isFeatureEnabled: () => true }));

import { NextRequest } from "next/server";
import * as cartUpdate from "../cart/update/[id]/route";
import * as cartRemove from "../cart/remove/[id]/route";
import * as wishlistRemove from "../wishlist/remove/[id]/route";
import * as userRole from "../users/[userId]/role/route";
import * as userStatus from "../users/[userId]/status/route";
import * as orderById from "../order/[orderId]/route";
import * as orderStatus from "../order/[orderId]/status/route";
import * as orderAdmin from "../order/admin/[orderId]/route";
import * as updateOrderStatus from "../order/update-order-status/[id]/route";
import * as productReviews from "../reviews/product/[productId]/route";
import * as offerAction from "../ai/sales/offers/[offerId]/[action]/route";

type RouteHandler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

// Each route types its own params; the table only needs a common call shape.
const asHandler = (handler: unknown) => handler as RouteHandler;

const HOSTILE = "../../users/victim/role";
const ENCODED = encodeURIComponent(HOSTILE);

// [label, handler, method, params, expected backend path suffix, requires auth]
const cases: Array<[string, RouteHandler, string, Record<string, string>, string, boolean]> = [
  ["cart update", asHandler(cartUpdate.PUT), "PUT", { id: HOSTILE }, `/api/cart/update/${ENCODED}`, true],
  ["cart remove", asHandler(cartRemove.DELETE), "DELETE", { id: HOSTILE }, `/api/cart/remove/${ENCODED}`, true],
  ["wishlist remove", asHandler(wishlistRemove.DELETE), "DELETE", { id: HOSTILE }, `/api/wishlist/remove/${ENCODED}`, true],
  ["user role", asHandler(userRole.PATCH), "PATCH", { userId: HOSTILE }, `/api/users/${ENCODED}/role`, true],
  ["user status", asHandler(userStatus.PATCH), "PATCH", { userId: HOSTILE }, `/api/users/${ENCODED}/status`, true],
  ["order by id", asHandler(orderById.GET), "GET", { orderId: HOSTILE }, `/api/order/${ENCODED}`, true],
  ["order status", asHandler(orderStatus.PUT), "PUT", { orderId: HOSTILE }, `/api/order/${ENCODED}/status`, true],
  ["admin order", asHandler(orderAdmin.GET), "GET", { orderId: HOSTILE }, `/api/order/admin/${ENCODED}`, true],
  ["update order status", asHandler(updateOrderStatus.PUT), "PUT", { id: HOSTILE }, `/api/order/${ENCODED}/status`, true],
  ["product reviews", asHandler(productReviews.GET), "GET", { productId: HOSTILE }, `/api/reviews/product/${ENCODED}`, false],
  ["offer action", asHandler(offerAction.POST), "POST", { offerId: HOSTILE, action: "shown" }, `/api/ai/sales/offers/${ENCODED}/shown`, false],
];

function makeRequest(method: string, withAuth: boolean) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (withAuth) headers.set("cookie", "accessToken=acc; refreshToken=ref");
  const hasBody = method !== "GET" && method !== "DELETE";
  return new NextRequest("http://localhost:3012/api/x", { method, headers, body: hasBody ? "{}" : undefined });
}

describe("dynamic BFF routes", () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env = { ...originalEnv, DEV_URL: "http://backend.test" };
    fetchMock = jest.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } }))
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  it.each(cases)("%s percent-encodes path params so they cannot reach another endpoint", async (_label, handler, method, params, suffix) => {
    const res = await handler(makeRequest(method, true), { params: Promise.resolve(params) });
    expect(res.status).toBe(200);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe(suffix);
  });

  it.each(cases.filter((c) => c[5]))("%s returns 401 without calling the backend when signed out", async (_label, handler, method, params) => {
    const res = await handler(makeRequest(method, false), { params: Promise.resolve(params) });
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported sales-offer actions with 404", async () => {
    const res = await asHandler(offerAction.POST)(makeRequest("POST", false), { params: Promise.resolve({ offerId: "o1", action: "delete" }) });
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes backend error statuses through unchanged", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: false, message: "Forbidden" }), { status: 403 }));
    const res = await asHandler(userRole.PATCH)(makeRequest("PATCH", true), { params: Promise.resolve({ userId: "u1" }) });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ success: false, message: "Forbidden" });
  });
});
