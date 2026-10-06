jest.mock("@/lib/http", () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));
jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { http } from "@/lib/http";
import { useOrderStore } from "../useOrderStore";
import type { AdminOrder, Order } from "../../types/orderTypes";

const api = http as unknown as { get: jest.Mock; post: jest.Mock; put: jest.Mock };
const axiosError = (status: number, data: unknown) => Object.assign(new Error("HTTP"), { response: { status, data } });
const order = (id: string, status = "PENDING") => ({ id, status }) as unknown as Order;

describe("useOrderStore", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useOrderStore.setState({ currentOrder: null, isLoading: false, error: null, isPaymentProcessing: false, adminOrders: [], userOrders: [] });
  });

  it("createOrder returns the payment payload and resets processing flags", async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { approvalUrl: "https://pay" } } });
    const input = { cartItemIds: ["c1"], total: 10, paymentMethod: "STRIPE", addressId: "a1" };
    await expect(useOrderStore.getState().createOrder(input as never)).resolves.toMatchObject({ success: true });
    expect(api.post.mock.calls[0][0]).toBe("order/create-order");
    expect(useOrderStore.getState()).toMatchObject({ isLoading: false, isPaymentProcessing: false });
  });

  it("createOrder rethrows and surfaces server validation (e.g. invalid coupon)", async () => {
    api.post.mockRejectedValue(axiosError(400, { message: "Coupon has expired" }));
    await expect(useOrderStore.getState().createOrder({} as never)).rejects.toBeTruthy();
    expect(useOrderStore.getState()).toMatchObject({ error: "Coupon has expired", isPaymentProcessing: false });
  });

  it("captureOrder stores the confirmed order", async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { order: order("o1", "CONFIRMED") } } });
    await useOrderStore.getState().captureOrder({ paymentId: "p", paymentMethod: "STRIPE", internalOrderId: "o1" } as never);
    expect(useOrderStore.getState().currentOrder).toEqual(order("o1", "CONFIRMED"));
  });

  it("captureOrder falls back to the error field", async () => {
    api.post.mockRejectedValue(axiosError(402, { error: "Payment not completed" }));
    await expect(useOrderStore.getState().captureOrder({} as never)).rejects.toBeTruthy();
    expect(useOrderStore.getState().error).toBe("Payment not completed");
  });

  it("updateOrderStatus patches the current and admin orders", async () => {
    useOrderStore.setState({ currentOrder: order("o1"), adminOrders: [order("o1"), order("o2")] as unknown as AdminOrder[] });
    api.put.mockResolvedValue({});
    await expect(useOrderStore.getState().updateOrderStatus("o1", "SHIPPED" as never)).resolves.toBe(true);
    expect(useOrderStore.getState().currentOrder?.status).toBe("SHIPPED");
    expect(useOrderStore.getState().adminOrders.map((o) => o.status)).toEqual(["SHIPPED", "PENDING"]);
  });

  it("updateOrderStatus reports the server's rejection (invalid status)", async () => {
    api.put.mockRejectedValue(axiosError(400, { message: "Invalid order status" }));
    await expect(useOrderStore.getState().updateOrderStatus("o1", "BOGUS" as never)).resolves.toBe(false);
    expect(useOrderStore.getState().error).toBe("Invalid order status");
  });

  it("getOrderForUser clears loading on success and failure", async () => {
    api.get.mockResolvedValueOnce({ data: { data: order("o1") } });
    await expect(useOrderStore.getState().getOrderForUser("o1")).resolves.toEqual(order("o1"));
    expect(useOrderStore.getState().isLoading).toBe(false);

    api.get.mockRejectedValueOnce(axiosError(404, { message: "Order not found" }));
    await expect(useOrderStore.getState().getOrderForUser("nope")).resolves.toBeNull();
    expect(useOrderStore.getState()).toMatchObject({ isLoading: false, currentOrder: null, error: "Order not found" });
  });

  it("list endpoints default to empty arrays", async () => {
    api.get.mockResolvedValue({ data: {} });
    await expect(useOrderStore.getState().getAllOrders()).resolves.toEqual([]);
    await expect(useOrderStore.getState().getAllOrdersForAdmin()).resolves.toEqual([]);
    await expect(useOrderStore.getState().getSellerSalesLines()).resolves.toEqual([]);
  });

  it("getAdminTransactions uses a zeroed fallback when the payload is missing", async () => {
    api.get.mockResolvedValue({ data: {} });
    const result = await useOrderStore.getState().getAdminTransactions({ limit: 50 } as never);
    expect(result).toMatchObject({ items: [], meta: { page: 1, limit: 50, total: 0, totalPages: 1 } });
    expect(useOrderStore.getState().adminTransactionsSummary.totalAmount).toBe(0);
  });

  it("returns null with an error when admin fetches fail", async () => {
    api.get.mockRejectedValue(axiosError(403, {}));
    await expect(useOrderStore.getState().getAllOrdersForAdmin()).resolves.toBeNull();
    expect(useOrderStore.getState().error).toBe("Failed to fetch all orders for admin");
    await expect(useOrderStore.getState().getOrderForAdmin("o1")).resolves.toBeNull();
    await expect(useOrderStore.getState().getAdminTransactions()).resolves.toBeNull();
  });
});
