"use client";

import Image from "next/image";
import Link from "next/link";
import type { RecommendedProduct } from "@/lib/assistant/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

type AssistantProductCardsProps = {
  products: RecommendedProduct[];
};

export function AssistantProductCards({ products }: AssistantProductCardsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      {products.map((product) => {
        const imageUrl = product.images[0];
        const hasDiscount =
          product.discountPercent != null && product.discountPercent > 0;

        return (
          <div
            key={product.id}
            className="flex gap-3 rounded-xl border border-border/70 bg-background/80 p-2"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {product.name}
              </p>
              <p className="text-xs text-muted-foreground">{product.brand}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-primary">
                  {formatPrice(product.effectivePrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.price)}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {product.discountPercent}% off
                    </Badge>
                  </>
                )}
              </div>
              <Button
                asChild
                variant="link"
                className="h-auto p-0 text-xs"
              >
                <Link href={`/products/${product.id}`}>View product</Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
