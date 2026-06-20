"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isFeatureEnabled } from "@/lib/feature-flags";

type ProductReview = {
  id: string;
  rating: number;
  body: string;
  themes: string[];
  sentiment: string | null;
  authorName: string;
  createdAt: string;
};

type ProductReviewsPanelProps = {
  productId: string;
};

export function ProductReviewsPanel({ productId }: ProductReviewsPanelProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const enabled = isFeatureEnabled("ai.reviewAnalyzer");

  useEffect(() => {
    if (!enabled || !productId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/reviews/product/${productId}`)
      .then(async (res) => {
        const json = (await res.json()) as {
          data?: { reviews?: ProductReview[] };
        };
        if (!cancelled) {
          setReviews(json.data?.reviews ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, enabled]);

  if (!enabled) {
    return (
      <p className="text-muted-foreground text-center">
        Reviews are not enabled on this store.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-center">Loading reviews…</p>;
  }

  if (reviews.length === 0) {
    return (
      <p className="text-muted-foreground text-center">
        No reviews yet. Be the first to review this product!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="rounded-lg border border-border/60 bg-muted/20 p-4 text-left"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-foreground">{review.authorName}</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-3.5 w-3.5 ${
                    index < review.rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{review.body}</p>
          {review.themes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {review.themes.map((theme) => (
                <Badge key={theme} variant="secondary" className="text-xs">
                  {theme.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
