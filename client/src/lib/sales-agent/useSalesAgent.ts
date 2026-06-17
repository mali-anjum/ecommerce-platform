"use client";

import { useCallback, useEffect, useState } from "react";
import { getAnalyticsSessionId } from "@/lib/analytics/sessionId";
import { getAnalyticsVisitorId } from "@/lib/analytics/visitorId";
import { sentryTracker } from "@/lib/monitoring";
import type { SalesAgentContext, SalesAgentOffer } from "@/lib/sales-agent/types";

const POLL_INTERVAL_MS = 30_000;

type ApiEnvelope<T> = { data?: T };

export function useSalesAgent(enabled = true) {
  const [context, setContext] = useState<SalesAgentContext | null>(null);
  const [activeOffer, setActiveOffer] = useState<SalesAgentOffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureSubmitting, setCaptureSubmitting] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    if (!enabled) return;

    const sessionId = getAnalyticsSessionId();
    const visitorId = getAnalyticsVisitorId();
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ sessionId });
      if (visitorId) params.set("visitorId", visitorId);

      const response = await fetch(`/api/ai/sales/context?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) return;

      const payload = (await response.json()) as ApiEnvelope<{
        context: SalesAgentContext | null;
      }>;
      const nextContext = payload.data?.context ?? null;
      setContext(nextContext);

      if (nextContext) {
        setActiveOffer((current) => current ?? nextContext.offers[0] ?? null);
        if (nextContext.shouldCaptureEmail && nextContext.offers.length === 0) {
          setCaptureOpen(true);
        }
      }
    } catch (error) {
      sentryTracker(error, { source: "useSalesAgent.fetchContext" });
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  const dismissOffer = useCallback(async (offerId: string) => {
    const sessionId = getAnalyticsSessionId();
    if (!sessionId) return;

    try {
      await fetch(`/api/ai/sales/offers/${offerId}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      sentryTracker(error, { source: "useSalesAgent.dismiss" });
    }

    setActiveOffer(null);
    setContext((current) =>
      current
        ? {
            ...current,
            offers: current.offers.filter((offer) => offer.id !== offerId),
          }
        : null,
    );
  }, []);

  const acknowledgeOffer = useCallback(async (offerId: string) => {
    const sessionId = getAnalyticsSessionId();
    if (!sessionId) return;

    try {
      await fetch(`/api/ai/sales/offers/${offerId}/shown`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      sentryTracker(error, { source: "useSalesAgent.shown" });
    }
  }, []);

  const submitCaptureEmail = useCallback(async (email: string) => {
    const sessionId = getAnalyticsSessionId();
    const visitorId = getAnalyticsVisitorId();
    if (!sessionId) return false;

    setCaptureSubmitting(true);
    setCaptureError(null);

    try {
      const response = await fetch("/api/ai/sales/capture-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          email,
          visitorId: visitorId || undefined,
        }),
      });

      if (!response.ok) {
        setCaptureError("Could not save your email. Please try again.");
        return false;
      }

      setCaptureOpen(false);
      await fetchContext();
      return true;
    } catch (error) {
      sentryTracker(error, { source: "useSalesAgent.captureEmail" });
      setCaptureError("Something went wrong. Please try again.");
      return false;
    } finally {
      setCaptureSubmitting(false);
    }
  }, [fetchContext]);

  useEffect(() => {
    if (!enabled) return;

    void fetchContext();
    const timer = window.setInterval(() => {
      void fetchContext();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [enabled, fetchContext]);

  useEffect(() => {
    if (!activeOffer) return;
    void acknowledgeOffer(activeOffer.id);
  }, [activeOffer, acknowledgeOffer]);

  return {
    context,
    activeOffer,
    isLoading,
    captureOpen,
    setCaptureOpen,
    captureSubmitting,
    captureError,
    dismissOffer,
    submitCaptureEmail,
    refresh: fetchContext,
  };
}
