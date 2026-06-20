"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/trackEvent";

const PING_INTERVAL_MS = 60_000;

export function useBrowsingTracker(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const ping = () => {
      trackAnalyticsEvent({ type: "SESSION_PING" });
    };

    ping();
    const timer = window.setInterval(ping, PING_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled]);
}
