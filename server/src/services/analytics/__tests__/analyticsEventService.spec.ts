jest.mock("../../../lib/prisma", () => ({ prisma: { analyticsEvent: { create: jest.fn() } } }));
jest.mock("../../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { prisma } from "../../../lib/prisma";
import { sentryTracker } from "../../../lib/monitoring";
import { logAnalyticsEvent, scheduleAnalyticsEvent } from "../analyticsEventService";

const create = prisma.analyticsEvent.create as jest.Mock;

describe("analyticsEventService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("stores nulls and an empty metadata object for omitted fields", async () => {
    await logAnalyticsEvent({ type: "PRODUCT_VIEW" });
    expect(create).toHaveBeenCalledWith({ data: { type: "PRODUCT_VIEW", userId: null, sessionId: null, metadata: {} } });
  });

  it("stores provided ids and metadata", async () => {
    await logAnalyticsEvent({ type: "CART_ADD", userId: "u1", sessionId: "s1", metadata: { productId: "p1" } });
    expect(create.mock.calls[0][0].data).toEqual({ type: "CART_ADD", userId: "u1", sessionId: "s1", metadata: { productId: "p1" } });
  });

  it("scheduled logging never throws and reports failures", async () => {
    create.mockRejectedValue(new Error("db down"));
    expect(() => scheduleAnalyticsEvent({ type: "CHAT" })).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(sentryTracker).toHaveBeenCalledWith(expect.any(Error), { source: "analyticsEventService" });
  });
});
