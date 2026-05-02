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

export interface OrderStore {
  currentOrder: Order | null;
  isLoading: boolean;
  isPaymentProcessing: boolean;
  userOrders: Order[];
  adminOrders: AdminOrder[];
  error: string | null;
  // NEW: Unified methods
  createOrder: (orderData: {
    items: any[];
    total: number;
    paymentMethod: string;
    addressId: string;
    couponId?: string;
  }) => Promise<any>;
  
  captureOrder: (captureData: {
    paymentId: string;
    paymentMethod: string;
    internalOrderId: string;
    cardData?: any;
  }) => Promise<any>;
  getOrderForUser: (orderId: string) => Promise<Order | null>;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"]
  ) => Promise<boolean>;
  getAllOrders: () => Promise<Order[] | null>;
  getOrderForAdmin: (orderId: string) => Promise<Order | null>;
  getSellerSalesLines: (params?: {
    page?: number;
    limit?: number;
  }) => Promise<SellerOrderLine[] | null>;
  setCurrentOrder: (order: Order | null) => void;
}
