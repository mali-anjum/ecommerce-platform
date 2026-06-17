import type { RecommendedProduct } from "@/lib/assistant/types";

export type SalesOfferTrigger =
  | "PRODUCT_CLUSTER"
  | "CART_ABANDON"
  | "HIGH_BROWSING"
  | "RETURN_VISIT";

export type SalesCustomerSegment =
  | "BROWSER"
  | "HIGH_INTENT"
  | "CART_ABANDONER"
  | "RETURN_VISITOR"
  | "CONVERTED";

export type IntentScoreBreakdown = {
  productViews: number;
  browsing: number;
  cartAbandon: number;
  returnVisits: number;
  chat: number;
  cartAdds: number;
  total: number;
};

export type SalesAgentOffer = {
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
  segment: SalesCustomerSegment;
  triggers: SalesOfferTrigger[];
  shouldCaptureEmail: boolean;
  offers: SalesAgentOffer[];
};

export type SalesAgentAdminDashboard = {
  period: string;
  summary: {
    offersGenerated: number;
    offersShown: number;
    offersConverted: number;
    emailsQueued: number;
    emailsSent: number;
    emailsFailed: number;
    avgIntentScore: number;
    offerConversionRate: number;
    offersChangePercent: number;
  };
  segmentBreakdown: Array<{ segment: string; label: string; count: number }>;
  triggerBreakdown: Array<{ trigger: string; count: number }>;
  scoreDistribution: Array<{ bucket: string; count: number }>;
  recentOffers: Array<{
    id: string;
    intentScore: number;
    segment: string;
    intentSummary: string;
    triggerReason: string;
    status: string;
    email: string | null;
    couponCode: string | null;
    createdAt: string;
  }>;
  recentEmailJobs: Array<{
    id: string;
    toEmail: string;
    jobType: string;
    status: string;
    scheduledAt: string;
    sentAt: string | null;
    attempts: number;
  }>;
};

export function formatSalesTrigger(trigger: SalesOfferTrigger): string {
  switch (trigger) {
    case "PRODUCT_CLUSTER":
      return "Based on products you viewed";
    case "CART_ABANDON":
      return "Complete your cart";
    case "HIGH_BROWSING":
      return "Special offer for your visit";
    case "RETURN_VISIT":
      return "Welcome back offer";
    default:
      return "Personalized for you";
  }
}

export function formatSegmentLabel(segment: string): string {
  return segment
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function intentScoreLabel(score: number): string {
  if (score >= 80) return "Very high";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  return "Low";
}
