import type { SalesOfferTrigger } from "@prisma/client";
import type { RecommendedProduct } from "../types";

export type BehaviorSignals = {
  sessionId: string;
  userId?: string;
  visitorId?: string;
  email?: string;
  viewedProductIds: string[];
  viewedProducts: ViewedProductSummary[];
  browsingMinutes: number;
  returnVisitDays: number;
  cartAbandoned: boolean;
  cartProductIds: string[];
  cartAddCount: number;
  chatCount: number;
  hasOrderComplete: boolean;
  estimatedCartValue: number;
  triggers: SalesOfferTrigger[];
};

export type ViewedProductSummary = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
};

export type BuyingIntentAnalysis = {
  intentSummary: string;
  themeKeywords: string[];
  complementaryCategories: string[];
};

export type IntentScoreBreakdown = {
  productViews: number;
  browsing: number;
  cartAbandon: number;
  returnVisits: number;
  chat: number;
  cartAdds: number;
  total: number;
};

export type SalesOfferPayload = {
  id: string;
  intentSummary: string;
  intentScore: number;
  segment: string;
  triggerReason: SalesOfferTrigger;
  couponCode: string | null;
  discountPercent: number | null;
  products: RecommendedProduct[];
};

export type SalesAgentContext = {
  intentScore: number;
  scoreBreakdown: IntentScoreBreakdown;
  segment: string;
  triggers: SalesOfferTrigger[];
  shouldCaptureEmail: boolean;
  offers: SalesOfferPayload[];
};

export const SALES_AGENT_CONSTANTS = {
  MIN_BROWSING_MINUTES: 5,
  MIN_PRODUCT_VIEWS_FOR_CLUSTER: 2,
  MIN_RETURN_VISIT_DAYS: 2,
  CART_ABANDON_MINUTES: 15,
  OFFER_COOLDOWN_HOURS: 24,
  DEFAULT_DISCOUNT_PERCENT: 10,
  COUPON_VALIDITY_DAYS: 7,
  MIN_INTENT_SCORE_FOR_OFFER: 40,
  MIN_INTENT_SCORE_FOR_EMAIL: 50,
  MIN_INTENT_SCORE_FOR_CAPTURE_EMAIL: 45,
  EMAIL_QUEUE_POLL_MS: 60_000,
  EMAIL_MAX_ATTEMPTS: 3,
} as const;

export const EMAIL_DRIP_DELAYS_MS: Record<string, number> = {
  FOLLOW_UP_IMMEDIATE: 0,
  FOLLOW_UP_1H: 60 * 60 * 1000,
  FOLLOW_UP_24H: 24 * 60 * 60 * 1000,
  FOLLOW_UP_72H: 72 * 60 * 60 * 1000,
};
