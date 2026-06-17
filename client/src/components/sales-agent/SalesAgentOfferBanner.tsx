"use client";

import { Sparkles, Tag, X } from "lucide-react";
import { AssistantProductCards } from "@/components/assistant/AssistantProductCards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatSalesTrigger,
  formatSegmentLabel,
  intentScoreLabel,
  type SalesAgentOffer,
} from "@/lib/sales-agent/types";

type SalesAgentOfferBannerProps = {
  offer: SalesAgentOffer;
  onDismiss: (offerId: string) => void;
};

export function SalesAgentOfferBanner({
  offer,
  onDismiss,
}: SalesAgentOfferBannerProps) {
  return (
    <Card className="fixed bottom-44 right-8 z-40 w-[min(100vw-2rem,22rem)] border-primary/30 bg-background/95 shadow-xl backdrop-blur">
      <CardHeader className="relative space-y-2 pb-3">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2 h-8 w-8"
          aria-label="Dismiss offer"
          onClick={() => onDismiss(offer.id)}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 pr-8 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Personalized offer
          </span>
        </div>
        <CardTitle className="text-base leading-snug">{offer.intentSummary}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Intent {offer.intentScore} · {intentScoreLabel(offer.intentScore)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {formatSegmentLabel(offer.segment)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatSalesTrigger(offer.triggerReason)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {offer.couponCode && offer.discountPercent ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-sm">
            <Tag className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Use <strong>{offer.couponCode}</strong> for {offer.discountPercent}% off
            </span>
          </div>
        ) : null}
        <AssistantProductCards products={offer.products} />
      </CardContent>
    </Card>
  );
}
