/** Provider payment attempt row (matches server `Payment` model). */
export interface OrderPaymentAttempt {
  id: string;
  method: "CREDIT_CARD" | "PAYPAL" | "STRIPE";
  attemptStatus: string;
  providerReferenceId?: string | null;
  providerCaptureId?: string | null;
  approvalUrl?: string | null;
  checkoutUrl?: string | null;
  amount?: number | null;
  currency?: string;
  capturedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  items: OrderItem[];
  couponId?: string;
  total: number;
  status:
    | "PENDING"
    | "DRAFT"
    | "PENDING_PAYMENT"
    | "PAYMENT_APPROVED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "PAYMENT_FAILED"
    | "CAPTURE_FAILED";
  paymentMethod: "CREDIT_CARD" | "PAYPAL" | "STRIPE";
  paymentStatus: "PENDING" | "APPROVED" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  /** Latest payment attempts (new normalized API). */
  payments?: OrderPaymentAttempt[];
  /** Aliases derived from latest payment for backward compatibility. */
  paymentId?: string;
  providerOrderId?: string;
  providerCaptureId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder {
  id: string;
  userId: string;
  addressId: string;
  items: OrderItem[];
  couponId?: string;
  total: number;
  status:
    | "PENDING"
    | "DRAFT"
    | "PENDING_PAYMENT"
    | "PAYMENT_APPROVED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "PAYMENT_FAILED"
    | "CAPTURE_FAILED";
  paymentMethod: "CREDIT_CARD" | "PAYPAL" | "STRIPE";
  paymentStatus: "PENDING" | "APPROVED" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  payments?: OrderPaymentAttempt[];
  paymentId?: string;
  providerOrderId?: string;
  providerCaptureId?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateOrderData {
  userId: string;
  addressId: string;
  items: Omit<OrderItem, "id">[];
  couponId?: string;
  total: number;
  paymentMethod: "CREDIT_CARD" | "PAYPAL" | "STRIPE";
  paymentStatus: "PENDING" | "APPROVED" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  paymentId?: string;
}

export interface SellerOrderLine {
  id: string;
  quantity: number;
  price: number;
  orderId: string;
  order: {
    id: string;
    status: string;
    createdAt: string;
    paymentStatus: string;
  };
  product: { id: string; name: string } | null;
}

export interface CheckoutOrderItemInput {
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
}

export interface CreateOrderInput {
  items: CheckoutOrderItemInput[];
  total: number;
  paymentMethod: "PAYPAL" | "STRIPE" | "CARD";
  addressId: string;
  couponId?: string;
}

export interface CaptureOrderInput {
  paymentId: string;
  paymentMethod: string;
  internalOrderId: string;
  cardData?: Record<string, unknown>;
}

export interface ApiResult<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateOrderResultData {
  internalOrderId: string;
  paymentId: string;
  providerOrderId: string;
  status: string;
  paymentMethod: string;
  approvalUrl?: string;
  url?: string;
  clientSecret?: string;
}

export interface CaptureOrderResultData {
  order?: Order;
  captureData?: unknown;
}

export interface AdminTransaction {
  id: string;
  method: "PAYPAL" | "STRIPE" | "CREDIT_CARD";
  attemptStatus: "PENDING" | "AUTHORIZED" | "COMPLETED" | "FAILED" | "CANCELLED";
  providerReferenceId?: string | null;
  providerCaptureId?: string | null;
  amount?: number | null;
  currency: string;
  createdAt: string;
  capturedAt?: string | null;
  order: {
    id: string;
    status: string;
    paymentStatus: string;
    total: number;
    currency: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
}

export interface AdminTransactionsSummary {
  totalTransactions: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  totalAmount: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminTransactionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  method?: "PAYPAL" | "STRIPE" | "CREDIT_CARD";
  status?: "PENDING" | "AUTHORIZED" | "COMPLETED" | "FAILED" | "CANCELLED";
}

export interface AdminTransactionsResponse {
  items: AdminTransaction[];
  summary: AdminTransactionsSummary;
  meta: PaginationMeta;
}

export interface OrderStore {
  currentOrder: Order | null;
  isLoading: boolean;
  isPaymentProcessing: boolean;
  userOrders: Order[];
  adminOrders: AdminOrder[];
  adminTransactions: AdminTransaction[];
  adminTransactionsSummary: AdminTransactionsSummary;
  adminTransactionsMeta: PaginationMeta;
  error: string | null;
  // NEW: Unified methods
  createOrder: (orderData: CreateOrderInput) => Promise<ApiResult<CreateOrderResultData>>;
  captureOrder: (captureData: CaptureOrderInput) => Promise<ApiResult<CaptureOrderResultData>>;
  getOrderForUser: (orderId: string) => Promise<Order | null>;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"]
  ) => Promise<boolean>;
  getAllOrders: () => Promise<Order[] | null>;
  getAllOrdersForAdmin: () => Promise<AdminOrder[] | null>;
  getAdminTransactions: (
    params?: AdminTransactionsQuery
  ) => Promise<AdminTransactionsResponse | null>;
  getOrderForAdmin: (orderId: string) => Promise<Order | null>;
  getSellerSalesLines: (params?: {
    page?: number;
    limit?: number;
  }) => Promise<SellerOrderLine[] | null>;
  setCurrentOrder: (order: Order | null) => void;
}
