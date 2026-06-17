jest.mock("../../order/query", () => ({
  findOrdersForUser: jest.fn(),
  findOrderForPublicTracking: jest.fn(),
}));

jest.mock("../knowledge/loaders/LoadPolicies", () => ({
  loadPolicies: jest.fn().mockResolvedValue({
    returnPolicy: "Returns accepted within 30 days.",
    shippingPolicy: "Standard shipping 3-5 days.",
    shipsInternationally: false,
    internationalShippingDetails: "",
    supportEmail: "support@store.test",
  }),
}));

import {
  findOrderForPublicTracking,
  findOrdersForUser,
} from "../../order/query";
import { runOrderSupportChat } from "../orders/OrderSupportService";

const mockFindOrders = findOrdersForUser as jest.Mock;
const mockFindGuest = findOrderForPublicTracking as jest.Mock;

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
    mockFindGuest.mockReset();
  });

  it("requires auth for order lookups", async () => {
    const result = await runOrderSupportChat({
      message: "Where is my order?",
    });

    expect(result.requiresAuth).toBe(true);
    expect(result.orders).toHaveLength(0);
    expect(result.reply).toContain("order ID");
  });

  it("tracks guest orders with order id and email", async () => {
    mockFindGuest.mockResolvedValue(sampleOrder);

    const result = await runOrderSupportChat({
      message: `Track order ${sampleOrder.id} email buyer@example.com`,
      orderId: sampleOrder.id,
    });

    expect(result.requiresAuth).toBeUndefined();
    expect(result.orders).toHaveLength(1);
    expect(result.reply).toContain("Order #");
    expect(result.reply).toContain("Status:");
    expect(mockFindGuest).toHaveBeenCalledWith(
      sampleOrder.id,
      "buyer@example.com",
    );
  });

  it("returns structured tracking details for a single active order", async () => {
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
    expect(result.reply).toContain("Status:");
    expect(result.reply).toContain("1Z999");
    expect(result.reply).toContain("Expected delivery:");
  });

  it("returns refund guidance from store policies", async () => {
    mockFindOrders.mockResolvedValue([sampleOrder]);

    const result = await runOrderSupportChat({
      message: "How do I get a refund?",
      userId: "user-1",
      userRole: "USER",
    });

    expect(result.orderSupportIntent).toBe("refund_request");
    expect(result.reply).toContain("Returns & refunds");
    expect(result.reply).toContain("30 days");
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
