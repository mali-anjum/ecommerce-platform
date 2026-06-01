import { getAnalyticsSessionId } from "./sessionId";

export type AnalyticsEventType =
  | "CHAT"
  | "PRODUCT_VIEW"
  | "CART_ADD"
  | "ORDER_COMPLETE";

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
      metadata: input.metadata,
    }),
    keepalive: true,
  }).catch(() => {
    // Analytics should never block UX.
  });
}

export function trackProductView(productId: string): void {
  trackAnalyticsEvent({
    type: "PRODUCT_VIEW",
    metadata: { productId },
  });
}
