"use client";

import Image from "next/image";
import Link from "next/link";
import { Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAiRecommendedSetup } from "@/lib/recommendations/useAiRecommendedSetup";
import { isFeatureEnabled } from "@/lib/feature-flags";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

type AiRecommendedSetupSectionProps = {
  productId: string;
};

export function AiRecommendedSetupSection({
  productId,
}: AiRecommendedSetupSectionProps) {
  const enabled = isFeatureEnabled("ai.productRecommendations");
  const { setup, isLoading } = useAiRecommendedSetup(enabled ? productId : undefined);

  if (!enabled) {
    return null;
  }

  if (isLoading && !setup) {
    return (
      <section className="mt-12 md:mt-16" aria-label="Loading AI recommended setup">
        <div className="rounded-xl border border-border/70 bg-card/40 p-8 glass-effect border-glass-border">
          <p className="text-sm text-muted-foreground">Finding your recommended setup…</p>
        </div>
      </section>
    );
  }

  if (!setup || setup.products.length === 0) {
    return null;
  }

  const behaviorBased = setup.basedOn === "behavior";

  return (
    <section className="mt-12 md:mt-16" aria-labelledby="ai-recommended-setup-title">
      <Card className="overflow-hidden border-glass-border glass-effect">
        <CardHeader className="border-b border-border/70 bg-linear-to-r from-primary/5 via-transparent to-secondary/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  AI recommended setup
                </span>
              </div>
              <CardTitle id="ai-recommended-setup-title" className="text-2xl">
                {setup.setupTitle}
              </CardTitle>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {setup.intentSummary}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Layers className="h-3 w-3" />
              {behaviorBased ? "Based on your browsing" : "Pairs with this item"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {setup.products.map((product) => {
              const imageUrl = product.images[0];
              const hasDiscount =
                product.discountPercent != null && product.discountPercent > 0;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background/80 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="relative aspect-4/3 bg-muted">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="line-clamp-2 font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{product.brand}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                      <span className="font-semibold text-primary">
                        {formatPrice(product.effectivePrice)}
                      </span>
                      {hasDiscount ? (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.price)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-6 flex justify-center">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/products">Browse more accessories</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
