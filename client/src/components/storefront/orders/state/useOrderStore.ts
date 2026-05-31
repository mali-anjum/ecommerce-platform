import { create } from "zustand";
import {
  OrderStore,
  SellerOrderLine,
  Order,
  AdminOrder,
  AdminTransactionsResponse,
  ApiResult,
  CaptureOrderResultData,
  CreateOrderResultData,
} from "@/components/storefront/orders/types/orderTypes";
import { http } from "@/lib/http";
import { AxiosError } from "axios";

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

const getAxiosErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const axiosError = error as AxiosError<ApiErrorPayload>;
  return (
    axiosError.response?.data?.message ??
    axiosError.response?.data?.error ??
    fallback
  );
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  currentOrder: null,
  isLoading: true,
  error: null,
  isPaymentProcessing: false,
  userOrders: [],
  adminOrders: [],
  adminTransactions: [],
  adminTransactionsSummary: {
    totalTransactions: 0,
    completedCount: 0,
    failedCount: 0,
    pendingCount: 0,
    totalAmount: 0,
  },
  adminTransactionsMeta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },

  createOrder: async (orderData) => {
    set({ isLoading: true, error: null, isPaymentProcessing: true });
    try {
      const { data } = await http.post<ApiResult<CreateOrderResultData>>(
        `order/create-order`, 
        orderData,
        { withCredentials: true }
      );

      set({
        isLoading: false,
        isPaymentProcessing: false,
        currentOrder: null,
      });

      return data;
    } catch (error: unknown) {
      set({
        isLoading: false,
        isPaymentProcessing: false,
        error: getAxiosErrorMessage(error, "Failed to create order"),
      });
      throw error;
    }
  },

  captureOrder: async (captureData) => {
    set({ isLoading: true, error: null, isPaymentProcessing: true });
    try {
      const { data } = await http.post<ApiResult<CaptureOrderResultData>>(
        `order/capture-order`, // CHANGED: Unified endpoint
        captureData,
        { withCredentials: true }
      );

      set({
        isLoading: false,
        isPaymentProcessing: false,
        currentOrder: data.data?.order ?? null,
      });

      return data;
    } catch (error: unknown) {
      set({
        isLoading: false,
        isPaymentProcessing: false,
        error: getAxiosErrorMessage(error, "Failed to capture payment"),
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
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(
        err,
        "Failed to update the order status of product"
      );
      set({ error: message, isLoading: false });
      return false;
    }
  },

  getAllOrdersForAdmin: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await http.get<ApiResult<AdminOrder[]>>(
        `order/get-all-orders-for-admin`,
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

  getAdminTransactions: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await http.get<ApiResult<AdminTransactionsResponse>>(
        `order/transactions`,
        { withCredentials: true, params }
      );
      const payload = response.data?.data;
      if (!payload) {
        const fallback: AdminTransactionsResponse = {
          items: [],
          summary: {
            totalTransactions: 0,
            completedCount: 0,
            failedCount: 0,
            pendingCount: 0,
            totalAmount: 0,
          },
          meta: {
            page: 1,
            limit: Number(params?.limit ?? 20),
            total: 0,
            totalPages: 1,
          },
        };
        set({
          isLoading: false,
          adminTransactions: fallback.items,
          adminTransactionsSummary: fallback.summary,
          adminTransactionsMeta: fallback.meta,
        });
        return fallback;
      }

      set({
        isLoading: false,
        adminTransactions: payload.items,
        adminTransactionsSummary: payload.summary,
        adminTransactionsMeta: payload.meta,
      });
      return payload;
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: getAxiosErrorMessage(error, "Failed to fetch transactions"),
      });
      return null;
    }
  },
  
  setCurrentOrder: (order) => set({ currentOrder: order }),

  // (for both admin and user same -- output data depends on role of them )
  getAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await http.get<ApiResult<Order[]>>(
        `order/get-all-orders`,
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
      const response = await http.get<ApiResult<Order>>(
        `order/${orderId}`,
        { withCredentials: true }
      );
      const order = response.data?.data ?? null;
      set({ currentOrder: order, error: null });
      return order;
    } catch (error: unknown) {
      const message = getAxiosErrorMessage(error, "Failed to fetch your order");
      set({ error: message, currentOrder: null });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  getOrderForAdmin: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await http.get<ApiResult<Order>>(
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
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: getAxiosErrorMessage(error, "Failed to load sales"),
      });
      return null;
    }
  },
}));
