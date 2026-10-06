jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    analyticsEvent: { findMany: jest.fn() },
    product: { findMany: jest.fn() },
    user: { findUnique: jest.fn() },
    salesCustomerProfile: { findFirst: jest.fn() },
  },
}));

import { prisma } from "../../../../lib/prisma";
import { collectBehaviorSignals } from "../BehaviorSignalService";

const events = prisma.analyticsEvent.findMany as jest.Mock;
const products = prisma.product.findMany as jest.Mock;
const users = prisma.user.findUnique as jest.Mock;
const profiles = prisma.salesCustomerProfile.findFirst as jest.Mock;

const NOW = new Date("2026-03-15T12:00:00Z");
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);
const ev = (type: string, createdAt: Date, metadata: unknown = {}) => ({ type, createdAt, metadata });

describe("collectBehaviorSignals", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now: NOW, doNotFake: ["setImmediate", "nextTick"] });
    events.mockResolvedValue([]);
    products.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns empty signals and no triggers for a new session", async () => {
    const result = await collectBehaviorSignals({ sessionId: "s1" });
    expect(result).toMatchObject({
      sessionId: "s1",
      viewedProductIds: [],
      browsingMinutes: 0,
      returnVisitDays: 0,
      cartAbandoned: false,
      triggers: [],
      email: undefined,
    });
    expect(products).not.toHaveBeenCalled();
    expect(users).not.toHaveBeenCalled();
  });

  it("detects product cluster, cart abandonment and long browsing", async () => {
    events.mockResolvedValue([
      ev("PRODUCT_VIEW", minutesAgo(40), { productId: "p1" }),
      ev("PRODUCT_VIEW", minutesAgo(35), { productId: "p2" }),
      ev("PRODUCT_VIEW", minutesAgo(34), { productId: "p1" }),
      ev("PRODUCT_VIEW", minutesAgo(33), { productId: 42 }),
      ev("CART_ADD", minutesAgo(20), { productIds: ["p1", 7], productId: "p3" }),
      ev("CHAT", minutesAgo(19)),
      ev("SESSION_PING", minutesAgo(18)),
    ]);
    products.mockResolvedValue([
      { id: "p1", name: "Mac", brand: "Apple", category: "Laptops", price: 1000 },
      { id: "p2", name: "Mouse", brand: "Logi", category: "Accessories", price: 50 },
    ]);

    const result = await collectBehaviorSignals({ sessionId: "s1" });

    expect(result.viewedProductIds).toEqual(["p1", "p2"]);
    expect(result.cartProductIds.sort()).toEqual(["p1", "p3"]);
    expect(result).toMatchObject({ cartAddCount: 1, chatCount: 1, browsingMinutes: 22, cartAbandoned: true, estimatedCartValue: 1050 });
    expect(result.triggers).toEqual(["PRODUCT_CLUSTER", "CART_ABANDON", "HIGH_BROWSING"]);
    expect(products.mock.calls[0][0].where).toMatchObject({ isActive: true, isArchived: false });
  });

  it("does not flag abandonment for a recent cart add or a completed order", async () => {
    events.mockResolvedValue([ev("CART_ADD", minutesAgo(5), { productId: "p1" })]);
    expect((await collectBehaviorSignals({ sessionId: "s1" })).cartAbandoned).toBe(false);

    events.mockResolvedValue([ev("CART_ADD", minutesAgo(60), { productId: "p1" }), ev("ORDER_COMPLETE", minutesAgo(50))]);
    const result = await collectBehaviorSignals({ sessionId: "s1" });
    expect(result).toMatchObject({ cartAbandoned: false, hasOrderComplete: true });
  });

  it("counts return-visit days from visitor-wide events", async () => {
    events
      .mockResolvedValueOnce([ev("SESSION_PING", minutesAgo(1))])
      .mockResolvedValueOnce([
        ev("SESSION_PING", new Date("2026-03-10T10:00:00Z")),
        ev("SESSION_PING", new Date("2026-03-10T18:00:00Z")),
        ev("SESSION_PING", new Date("2026-03-15T11:00:00Z")),
      ]);
    const result = await collectBehaviorSignals({ sessionId: "s1", visitorId: "v1" });
    expect(result.returnVisitDays).toBe(2);
    expect(result.triggers).toContain("RETURN_VISIT");
    expect(events.mock.calls[1][0].where.metadata).toEqual({ path: ["visitorId"], equals: "v1" });
  });

  it("uses the account email for signed-in users", async () => {
    users.mockResolvedValue({ email: "ann@x.io" });
    const result = await collectBehaviorSignals({ sessionId: "s1", userId: "u1" });
    expect(result.email).toBe("ann@x.io");
    expect(events.mock.calls[0][0].where.OR).toEqual([{ sessionId: "s1" }, { userId: "u1" }]);
    expect(profiles).not.toHaveBeenCalled();
  });

  it("falls back to a captured guest email on the sales profile", async () => {
    profiles.mockResolvedValue({ email: "guest@x.io" });
    const result = await collectBehaviorSignals({ sessionId: "s1", visitorId: "v1" });
    expect(result.email).toBe("guest@x.io");
    expect(profiles.mock.calls[0][0].where.OR).toEqual([{ visitorId: "v1" }]);
  });
});
