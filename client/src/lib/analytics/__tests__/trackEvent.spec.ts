jest.mock("../sessionId", () => ({ getAnalyticsSessionId: jest.fn() }));
jest.mock("../visitorId", () => ({ getAnalyticsVisitorId: () => "visitor-1" }));
jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { getAnalyticsSessionId } from "../sessionId";
import { trackAnalyticsEvent, trackProductView } from "../trackEvent";
import { sentryTracker } from "@/lib/monitoring";

describe("trackAnalyticsEvent", () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn().mockResolvedValue(new Response(null, { status: 202 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    Object.assign(globalThis, { window: {} });
    (getAnalyticsSessionId as jest.Mock).mockReturnValue("sess-1");
  });

  afterAll(() => {
    global.fetch = originalFetch;
    Reflect.deleteProperty(globalThis, "window");
  });

  it("does nothing during server rendering", () => {
    Reflect.deleteProperty(globalThis, "window");
    trackProductView("p1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing without a session id", () => {
    (getAnalyticsSessionId as jest.Mock).mockReturnValue("");
    trackProductView("p1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts a keepalive event with session and visitor ids", () => {
    trackProductView("p1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/analytics/events");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(String(init.body))).toEqual({
      type: "PRODUCT_VIEW",
      sessionId: "sess-1",
      metadata: { visitorId: "visitor-1", productId: "p1" },
    });
  });

  it("prefers an explicit session id and reports network failures without throwing", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    expect(() => trackAnalyticsEvent({ type: "CHAT", sessionId: "explicit" })).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body)).sessionId).toBe("explicit");
    expect(sentryTracker).toHaveBeenCalled();
  });
});
