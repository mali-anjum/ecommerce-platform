export type AssistantMessageRole = "user" | "assistant";

/** @deprecated Use ClassifiedIntent in UI; kept for message display compatibility. */
export type AssistantChatIntent =
  | "general"
  | "product_recommendation"
  | "order_support"
  | "lead_capture"
  | "human_handoff";

export type ClassifiedIntent =
  | "FAQ"
  | "PRODUCT_SEARCH"
  | "ORDER_SUPPORT"
  | "LEAD"
  | "GENERAL_CHAT"
  | "HUMAN_HANDOFF";

export type LeadCaptureStep = "email" | "phone" | "message" | "complete";

export type LeadSession = {
  active: boolean;
  email?: string;
  phone?: string | null;
  message?: string;
  initialRequirement?: string;
};

export type LeadCapturePayload = {
  step: LeadCaptureStep;
  session: LeadSession;
  leadId?: string;
};

export type OrderSupportSubIntent =
  | "track_order"
  | "cancel_request"
  | "delivery_status"
  | "order_list";

export type RecommendedProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  discountPercent: number | null;
  effectivePrice: number;
  images: string[];
  category: string;
  stock: number;
  rating: number | null;
};

export type AssistantOrderTrackingEvent = {
  id: string;
  status: string | null;
  message: string;
  location: string | null;
  occurredAt: string;
};

export type AssistantOrderSummary = {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  createdAt: string;
  itemCount: number;
  carrier: string | null;
  trackingNumber: string | null;
  estimatedDeliveryAt: string | null;
  timeline: AssistantOrderTrackingEvent[];
  canRequestCancel: boolean;
};

export type AssistantMessage = {
  id: string;
  role: AssistantMessageRole;
  content: string;
  classifiedIntent?: ClassifiedIntent;
  products?: RecommendedProduct[];
  orders?: AssistantOrderSummary[];
  orderSupportIntent?: OrderSupportSubIntent;
  requiresAuth?: boolean;
  leadCapture?: LeadCapturePayload;
  supportTicket?: {
    id: string;
    status: "OPEN" | "CLOSED";
  };
};

export type AssistantChatResponse = {
  success: boolean;
  statusCode: number;
  data: {
    classifiedIntent: ClassifiedIntent;
    reply: string;
    products: RecommendedProduct[];
    productIdsReferenced: string[];
    orders?: AssistantOrderSummary[];
    orderSupportIntent?: OrderSupportSubIntent;
    requiresAuth?: boolean;
    leadCapture?: LeadCapturePayload;
    supportTicket?: {
      id: string;
      status: "OPEN" | "CLOSED";
    };
    sessionId?: string;
  };
  message: string;
};

export type LeadRecord = {
  id: string;
  email: string;
  phone: string | null;
  message: string;
  source: "AI" | "MANUAL";
  createdAt: string;
};

export type LeadCounts = {
  ai: number;
  manual: number;
  total: number;
};
