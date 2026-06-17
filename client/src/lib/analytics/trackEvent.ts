import { getAnalyticsSessionId } from "./sessionId";
import { getAnalyticsVisitorId } from "./visitorId";
import { sentryTracker } from "@/lib/monitoring";

export type AnalyticsEventType =
  | "CHAT"
  | "PRODUCT_VIEW"
  | "CART_ADD"
  | "ORDER_COMPLETE"
  | "SESSION_PING";

type TrackAnalyticsEventInput = {
  type: AnalyticsEventType;
  metadata?: Record<string, unknown>;
  sessionId?: string;
};

export function trackAnalyticsEvent(input: TrackAnalyticsEventInput): void {
  if (typeof window === "undefined") return;

  const sessionId = input.sessionId ?? getAnalyticsSessionId();
  if (!sessionId) return;

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      type: input.type,
      sessionId,
      metadata: {
        visitorId: getAnalyticsVisitorId(),
        ...input.metadata,
      },
    }),
    keepalive: true,
  }).catch((error) => {
    sentryTracker(error, { source: "trackAnalyticsEvent" });
  });
}

export function trackProductView(productId: string): void {
  trackAnalyticsEvent({
    type: "PRODUCT_VIEW",
    metadata: { productId },
  });
}
