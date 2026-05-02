// interfaces/payment.interface.ts

export interface PaymentOrderData {
  items: Array<{
    productId: string;
    productName: string;
    productCategory?: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
  }>;
  total: number;
  userId: string;
  currency: string;
  internalOrderId: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  captureId?: string;
  data?: any;
  error?: string;
  approvalUrl?: string; // Common field for redirect-based payments
  clientSecret?: string; // Common field for client-side payments
  url?: string; // For Stripe
}


export interface WebhookEvent {
  payload: any;      // The raw webhook body
  signature: string; // The signature header
  timestamp?: string; // Optional timestamp header
  provider?: string; // Which provider sent the webhook
}
export interface CreateOrderResponse {
  internalOrderId: string;
  paymentId: string;
  providerOrderId: string;
  approvalUrl?: string;
  clientSecret?: string;
  status: string;
  paymentMethod: string;
}

export interface PaymentProvider {
  getName(): string;
  createOrder(orderData: PaymentOrderData): Promise<PaymentResult>;
  capturePayment(paymentId: string): Promise<PaymentResult>;
  getOrderDetails(paymentId: string): Promise<PaymentResult>;
  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    timestamp: string
  ): Promise<boolean>;
  handleWebhook(event: WebhookEvent): Promise<void>;
  isRedirectBased(): boolean;
  isClientSecretBased(): boolean;
}

export interface PaymentMethod {
  // Common methods
  getName(): string;
  createOrder(orderData: PaymentOrderData): Promise<PaymentResult>;
  capturePayment(paymentId: string, data?: any): Promise<PaymentResult>;
  validatePayment(data: any): boolean;

  // Optional methods
  getOrderDetails?(paymentId: string): Promise<PaymentResult>;
  verifyWebhookSignature?(
    rawBody: string,
    signature: string,
    timestamp: string,
    certUrl: string,
    /** PayPal: `paypal-transmission-id` header */
    transmissionId?: string,
  ): Promise<boolean>;
  handleWebhook?(payload: any, signature: string): Promise<any>;
}
