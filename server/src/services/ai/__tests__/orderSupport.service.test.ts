jest.mock("../../order/query", () => ({
  findOrdersForUser: jest.fn(),
}));

import { findOrdersForUser } from "../../order/query";
import { runOrderSupportChat } from "../orders/OrderSupportService";

const mockFindOrders = findOrdersForUser as jest.Mock;

const sampleOrder = {
  id: "order-1",
  userId: "user-1",
  status: "SHIPPED",
  paymentStatus: "COMPLETED",
  total: 120,
  currency: "USD",
  createdAt: new Date("2026-05-01"),
  items: [{ id: "item-1" }, { id: "item-2" }],
  trackingEvents: [
    {
      id: "evt-1",
      status: "SHIPPED",
      message: "Package left the warehouse",
      location: "Chicago, IL",
      occurredAt: new Date("2026-05-02"),
    },
  ],
  shipments: [
    {
      carrier: "UPS",
      trackingNumber: "1Z999",
      estimatedDeliveryAt: new Date("2026-05-05"),
      trackingEvents: [],
    },
  ],
};

describe("runOrderSupportChat", () => {
  beforeEach(() => {
    mockFindOrders.mockReset();
  });

  it("requires auth for order lookups", async () => {
    const result = await runOrderSupportChat({
      message: "Where is my order?",
    });

    expect(result.requiresAuth).toBe(true);
    expect(result.orders).toHaveLength(0);
    expect(result.reply).toContain("sign in");
  });

  it("returns tracking details for a single active order", async () => {
    mockFindOrders.mockResolvedValue([sampleOrder]);

    const result = await runOrderSupportChat({
      message: "Where is my order?",
      userId: "user-1",
      userRole: "USER",
    });

    expect(result.intent).toBe("order_support");
    expect(result.orderSupportIntent).toBe("track_order");
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].trackingNumber).toBe("1Z999");
    expect(result.orders[0].timeline).toHaveLength(1);
    expect(result.reply).toContain("SHIPPED");
    expect(result.reply).toContain("1Z999");
  });

  it("explains cancellation rules for shipped orders", async () => {
    mockFindOrders.mockResolvedValue([sampleOrder]);

    const result = await runOrderSupportChat({
      message: "Cancel my order",
      userId: "user-1",
      userRole: "USER",
    });

    expect(result.orderSupportIntent).toBe("cancel_request");
    expect(result.reply).toContain("cannot be cancelled");
  });

  it("lists recent orders when none is uniquely selected", async () => {
    mockFindOrders.mockResolvedValue([
      sampleOrder,
      { ...sampleOrder, id: "order-2", status: "PROCESSING" },
    ]);

    const result = await runOrderSupportChat({
      message: "Where is my order?",
      userId: "user-1",
      userRole: "USER",
    });

    expect(result.orderSupportIntent).toBe("order_list");
    expect(result.orders.length).toBeGreaterThan(1);
    expect(result.reply).toContain("recent orders");
  });
});
