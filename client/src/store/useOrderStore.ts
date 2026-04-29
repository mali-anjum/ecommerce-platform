import { create } from "zustand";
import { OrderStore, SellerOrderLine } from "@/types/order/orderTypes";
import { http } from "@/lib/http";

export const useOrderStore = create<OrderStore>((set, get) => ({
  currentOrder: null,
  isLoading: true,
  error: null,
  isPaymentProcessing: false,
  userOrders: [],
  adminOrders: [],

  createOrder: async (orderData) => {
    set({ isLoading: true, error: null, isPaymentProcessing: true });
    try {
      const { data } = await http.post(
        `order/create-order`, 
        orderData,
        { withCredentials: true }
      );

      set({
        isLoading: false,
        isPaymentProcessing: false,
        currentOrder: data.data,
      });

      return data;
    } catch (error: any) {
      set({
        isLoading: false,
        isPaymentProcessing: false,
        error: error.response?.data?.message || "Failed to create order",
      });
      throw error;
    }
  },

  captureOrder: async (captureData) => {
    set({ isLoading: true, error: null, isPaymentProcessing: true });
    try {
      const { data } = await http.post(
        `order/capture-order`, // CHANGED: Unified endpoint
        captureData,
        { withCredentials: true }
      );

      set({
        isLoading: false,
        isPaymentProcessing: false,
        currentOrder: data.data.order,
      });

      return data;
    } catch (error: any) {
      set({
        isLoading: false,
        isPaymentProcessing: false,
        error: error.response?.data?.message || "Failed to capture payment",
      });
      throw error;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ isLoading: true, error: null });
    try {
      await http.put(
        `order/${orderId}/status`,
        { status },
        { withCredentials: true }
      );
      set((state) => ({
        currentOrder:
          state.currentOrder && state.currentOrder.id === orderId
            ? {
                ...state.currentOrder,
                status,
              }
            : state.currentOrder,
        isLoading: false,
        adminOrders: state.adminOrders.map((item) =>
          item.id === orderId
            ? {
                ...item,
                status,
              }
            : item
        ),
      }));
      return true;
    } catch (err: any) {
      const message =
        err.response.data.message ??
        "Failed to update the order status of product";
      set({ error: message, isLoading: false });
      return false;
    }
  },

  getAllOrdersForAdmin: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await http.get(
        `order/get-all-orders`,
        { withCredentials: true }
      );
      const orders = response.data?.data ?? [];
      set({ isLoading: false, adminOrders: orders });
      return orders;
    } catch (error) {
      set({ error: "Failed to fetch all orders for admin", isLoading: false });
      return null;
    }
  },
  
  setCurrentOrder: (order) => set({ currentOrder: order }),

  // (for both admin and user same -- output data depends on role of them )
  getAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await http.get(
        `order/get-all-orders-for-admin`,
        { withCredentials: true }
      );
      const orders = response.data?.data ?? [];
      set({ isLoading: false, userOrders: orders });
      return orders;
    } catch (error) {
      set({ error: "Failed to fetch all orders", isLoading: false });
      return null;
    }
  },

  getOrderForUser: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await http.get(
        `order/${orderId}`,
        { withCredentials: true }
      );
      const order = response.data?.data ?? null;
      set({ isLoading: false, currentOrder: order });
      return order;
    } catch (error) {
      set({ error: "Failed to fetch your order", isLoading: false });
      return null;
    }
  },

  getOrderForAdmin: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await http.get(
        `order/admin/${orderId}`,
        { withCredentials: true }
      );
      const order = response.data?.data ?? null;
      set({ isLoading: false, currentOrder: order });
      return order;
    } catch (error) {
      set({ error: "Failed to fetch order", isLoading: false });
      return null;
    }
  },

  getSellerSalesLines: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await http.get(`order/seller/my-sales`, {
        withCredentials: true,
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
        },
      });
      const lines = (response.data?.data?.items ?? []) as SellerOrderLine[];
      set({ isLoading: false });
      return Array.isArray(lines) ? lines : [];
    } catch (error: any) {
      set({
        isLoading: false,
        error:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load sales",
      });
      return null;
    }
  },
}));
