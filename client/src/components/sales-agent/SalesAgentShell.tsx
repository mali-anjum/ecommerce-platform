"use client";

import { SalesAgentCaptureModal } from "@/components/sales-agent/SalesAgentCaptureModal";
import { SalesAgentOfferBanner } from "@/components/sales-agent/SalesAgentOfferBanner";
import { useBrowsingTracker } from "@/lib/analytics/useBrowsingTracker";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { useSalesAgent } from "@/lib/sales-agent/useSalesAgent";

export function SalesAgentShell() {
  const enabled = isFeatureEnabled("ai.salesAgent");
  useBrowsingTracker(enabled);

  const {
    context,
    activeOffer,
    captureOpen,
    setCaptureOpen,
    captureSubmitting,
    captureError,
    dismissOffer,
    submitCaptureEmail,
  } = useSalesAgent(enabled);

  if (!enabled) {
    return null;
  }

  return (
    <>
      {context && captureOpen && !activeOffer ? (
        <SalesAgentCaptureModal
          open={captureOpen}
          onOpenChange={setCaptureOpen}
          intentScore={context.intentScore}
          intentSummary={
            context.triggers.length > 0
              ? "We noticed strong interest in your browsing"
              : undefined
          }
          isSubmitting={captureSubmitting}
          error={captureError}
          onSubmit={submitCaptureEmail}
        />
      ) : null}

      {activeOffer ? (
        <SalesAgentOfferBanner
          offer={activeOffer}
          onDismiss={(offerId) => {
            void dismissOffer(offerId);
          }}
        />
      ) : null}
    </>
  );
}
