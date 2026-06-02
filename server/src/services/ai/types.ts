export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantProductSnippet = {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  condition: string;
  discountPercent: number | null;
};

export type AssistantFaqSnippet = {
  question: string;
  answer: string;
  href: string | null;
};

export type AssistantPolicyContext = {
  returnPolicy: string;
  shippingPolicy: string;
  shipsInternationally: boolean;
  internationalShippingDetails: string;
  supportEmail: string | null;
};

export type AssistantCouponSnippet = {
  code: string;
  discountPercent: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  isActive: boolean;
};

export type AssistantKnowledgeDocumentSnippet = {
  id: string;
  title: string;
  content: string;
  sourceType: "PDF" | "MANUAL";
};

export type AssistantKnowledgeContext = {
  faqs: AssistantFaqSnippet[];
  policies: AssistantPolicyContext;
  products: AssistantProductSnippet[];
  coupons: AssistantCouponSnippet[];
  documents: AssistantKnowledgeDocumentSnippet[];
};

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

/** @internal Legacy handler routing; not sent in public API responses. */
export type AssistantHandlerIntent = AssistantChatIntent;

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

export type LeadCaptureResult = {
  intent: "lead_capture";
  reply: string;
  products: [];
  productIdsReferenced: string[];
  orders: [];
  leadCapture: LeadCapturePayload;
};

export type OrderSupportSubIntent =
  | "track_order"
  | "cancel_request"
  | "delivery_status"
  | "order_list";

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

export type OrderSupportResult = {
  intent: "order_support";
  orderSupportIntent: OrderSupportSubIntent;
  reply: string;
  orders: AssistantOrderSummary[];
  requiresAuth?: boolean;
};

export type RecommendationFilters = {
  maxPrice?: number;
  minPrice?: number;
  categories?: string[];
  searchTerms?: string[];
  preferDiscount?: boolean;
  sortBy?: "price_asc" | "price_desc" | "discount" | "popular";
};

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

export type ProductRecommendationResult = {
  intent: "product_recommendation";
  products: RecommendedProduct[];
  filtersApplied: RecommendationFilters;
};

export type AssistantChatInput = {
  message: string;
  productId?: string;
  orderId?: string;
  history?: ChatHistoryMessage[];
  userId?: string;
  userRole?: string;
  leadSession?: LeadSession;
  sessionId?: string;
};

export type AssistantChatResult = {
  intent: AssistantChatIntent;
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
