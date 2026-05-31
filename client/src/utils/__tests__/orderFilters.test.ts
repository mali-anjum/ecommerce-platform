import {
  filterOrdersByTab,
  orderMatchesTab,
  countOrdersByTab,
  isOrderTerminalFailure,
  getOrderStatusBadgeTone,
} from "../../components/storefront/orders/utils/orderFilters";
import type { Order } from "@/types/order/orderTypes";

const base = (status: Order["status"]): Order =>
  ({
    id: `order-${status}`,
    userId: "u1",
    addressId: "a1",
    items: [{ id: "i1", productId: "p1", productName: "Widget", productCategory: "General", quantity: 1, price: 10 }],
    total: 10,
    status,
    paymentMethod: "STRIPE",
    paymentStatus: "COMPLETED",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }) as Order;

describe("orderFilters", () => {
  const orders = [
    base("DELIVERED"),
    base("SHIPPED"),
    base("PROCESSING"),
    base("PENDING_PAYMENT"),
  ];

  it("filters to-review tab", () => {
    const filtered = filterOrdersByTab(orders, "to-review");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe("DELIVERED");
  });

  it("counts tabs", () => {
    const counts = countOrdersByTab(orders);
    expect(counts.all).toBe(4);
    expect(counts["to-pay"]).toBe(1);
    expect(counts["to-receive"]).toBe(1);
  });

  it("matches to-ship", () => {
    expect(orderMatchesTab(base("PROCESSING"), "to-ship")).toBe(true);
    expect(orderMatchesTab(base("DELIVERED"), "to-ship")).toBe(false);
  });

  it("identifies terminal failure statuses for badge UX", () => {
    expect(isOrderTerminalFailure("CANCELLED")).toBe(true);
    expect(isOrderTerminalFailure("PAYMENT_FAILED")).toBe(true);
    expect(isOrderTerminalFailure("CAPTURE_FAILED")).toBe(true);
    expect(isOrderTerminalFailure("DELIVERED")).toBe(false);
    expect(getOrderStatusBadgeTone("CANCELLED")).toBe("destructive");
    expect(getOrderStatusBadgeTone("SHIPPED")).toBe("primary");
  });
});
