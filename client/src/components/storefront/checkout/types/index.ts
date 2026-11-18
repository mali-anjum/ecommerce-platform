// types/checkout/index.ts

// Address type based on your AddressSelection component
export interface Address {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
  // Add any other fields your addresses have
}

// Cart item with product details
export interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    category?: string;
    images?: string[];
    // Add any other product fields you use
  };
}

// Coupon type (you already have this)
export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
}

// Payment order request
export interface PaymentOrderRequest {
  items: Array<{
    productId: string;
    productName: string;
    productCategory?: string;
    quantity: number;
    size?: string | null;
    color?: string | null;
    price: number;
  }>;
  total: number;
  paymentMethod: "PAYPAL" | "STRIPE" | "CARD";
  addressId: string;
  couponId?: string;
}

// Capture payment request
export interface CapturePaymentRequest {
  paymentId: string;
  paymentMethod: "PAYPAL" | "STRIPE" | "CARD";
  internalOrderId: string;
  cardData?: {
    cardNumber?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
  };
}

// Payment order response from backend
export interface PaymentOrderResponse {
  success: boolean;
  data: {
    internalOrderId: string;
    paymentId: string;
    providerOrderId: string;
    status: string;
    paymentMethod: string;
    approvalUrl?: string; // For PayPal
    url?: string; // For Stripe
    clientSecret?: string; // For Cards
  };
  message?: string;
  error?: string;
}

// Order summary props (simplified version)
export interface OrderSummaryProps {
  cartItems: CartItemWithProduct[];
  subtotal: number;
  discountAmount: number;
  total: number;
  couponCode: string;
  appliedCoupon: Coupon | null;
  couponError: string;
  onCouponChange: (code: string) => void;
  onApplyCoupon: () => void;
  isCheckoutReady?: boolean; 
}

// Address selection props
export interface AddressSelectionProps {
  addresses: Address[];
  selectedAddress: string;
  onSelectAddress: (id: string) => void;
  onAddNewAddress: () => void;
}

// Checkout progress props
export interface CheckoutStep {
  id: number;
  label: string;
  icon: React.ComponentType;
}

export interface CheckoutProgressProps {
  currentStep: number;
}

// Payment methods props
export interface PaymentMethodsProps {
  onSelectPaymentMethod: (method: "PAYPAL" | "STRIPE" | "CARD") => void;
  isLoading?: boolean;
  isReady?: boolean;
}

// Store types
export interface CartStore {
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    size?: string;
    color?: string;
  }>;
  fetchCart: () => Promise<void>;
  clearCart: () => Promise<void>;
  // ... other cart store methods
}

export interface OrderStore {
  createOrder: (data: PaymentOrderRequest) => Promise<PaymentOrderResponse>;
  captureOrder: (data: CapturePaymentRequest) => Promise<any>;
  isPaymentProcessing: boolean;
  // ... other order store methods
}