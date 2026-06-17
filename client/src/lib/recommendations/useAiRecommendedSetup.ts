"use client";

import { useCallback, useEffect, useState } from "react";
import { getAnalyticsSessionId } from "@/lib/analytics/sessionId";
import { getAnalyticsVisitorId } from "@/lib/analytics/visitorId";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { sentryTracker } from "@/lib/monitoring";
import type { AiRecommendedSetup } from "@/lib/recommendations/types";

type ApiEnvelope<T> = { data?: T };

export function useAiRecommendedSetup(productId: string | undefined) {
  const [setup, setSetup] = useState<AiRecommendedSetup | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSetup = useCallback(async () => {
    if (!productId || !isFeatureEnabled("ai.productRecommendations")) {
      setSetup(null);
      return;
    }

    const sessionId = getAnalyticsSessionId();
    const visitorId = getAnalyticsVisitorId();
    const params = new URLSearchParams({ productId });
    if (sessionId) params.set("sessionId", sessionId);
    if (visitorId) params.set("visitorId", visitorId);

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/ai/recommendations/setup?${params.toString()}`,
        { credentials: "include", cache: "no-store" },
      );
      if (!response.ok) {
        setSetup(null);
        return;
      }

      const payload = (await response.json()) as ApiEnvelope<{
        setup: AiRecommendedSetup | null;
      }>;
      setSetup(payload.data?.setup ?? null);
    } catch (error) {
      sentryTracker(error, { source: "useAiRecommendedSetup" });
      setSetup(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void fetchSetup();
  }, [fetchSetup]);

  return { setup, isLoading, refresh: fetchSetup };
}
