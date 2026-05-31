"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Heart,
  ExternalLink,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useToast } from "@/components/ui/hooks/use-toast";
import type { WishlistItem } from "@/types/wishlist/wishlistTypes";
import { getDisplayPrice } from "@/components/products/utils/productPricing";
import { cn } from "@/lib/utils";

const stockConfig = {
  available: {
    label: "In Stock",
    dot: "bg-success",
    badge:
      "border-success/30 bg-success/10 text-success",
  },
  out_of_stock: {
    label: "Out of Stock",
    dot: "bg-warning",
    badge:
      "border-warning/30 bg-warning/10 text-warning",
  },
  unavailable: {
    label: "Unavailable",
    dot: "bg-destructive",
    badge:
      "border-destructive/30 bg-destructive/10 text-destructive",
  },
} as const;

type WishlistItemCardProps = {
  item: WishlistItem;
};

export function WishlistItemCard({ item }: WishlistItemCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart } = useCartStore();
  const { removeFromWishlist } = useWishlistStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const displayPrice = getDisplayPrice({
    price: item.price,
    salePrice: item.salePrice,
  });
  const stock = stockConfig[item.availability];
  const hasDiscount =
    item.salePrice !== null && item.salePrice < item.price;

  const handleAddToCart = async () => {
    if (!item.isPurchasable) {
      toast({
        title: "Out of stock",
        description: "This item cannot be added to cart right now.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      await addToCart({
        productId: item.productId,
        name: item.name,
        price: displayPrice,
        image: item.thumbnail ?? "",
        color: item.colors[0] ?? "Default",
        size: item.sizes[0] ?? "",
        quantity: 1,
      });
      toast({ title: "Added to cart", description: item.name });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeFromWishlist(item.id);
      toast({ title: "Removed from wishlist" });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <article className="group flex flex-col gap-4 border-b border-border/60 p-4 transition-colors last:border-0 hover:bg-card/40 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
      {/* Product image — marketplace thumbnail */}
      <Link
        href={`/products/${item.productId}`}
        className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-glass-border bg-muted/50 sm:mx-0 sm:h-32 sm:w-32"
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        {hasDiscount && item.discountPercent !== null && (
          <span className="absolute left-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
            -{item.discountPercent}%
          </span>
        )}
      </Link>

      {/* Details — AliExpress / Daraz middle column */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Link
              href={`/products/${item.productId}`}
              className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary sm:text-base"
            >
              {item.name}
            </Link>
            {item.brand && (
              <p className="text-xs text-muted-foreground">
                {item.brand}
                {item.category ? ` · ${item.category}` : ""}
              </p>
            )}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                stock.badge
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", stock.dot)} />
              {stock.label}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            disabled={isRemoving}
            onClick={() => void handleRemove()}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove from wishlist"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Price row — visible on mobile & desktop */}
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            ${displayPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              ${item.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Actions — Daraz-style primary CTA */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {item.isPurchasable ? (
            <Button
              size="sm"
              disabled={isAdding}
              onClick={() => void handleAddToCart()}
              className="min-h-9 flex-1 bg-primary font-semibold text-primary-foreground hover:bg-primary-light sm:flex-none sm:px-6"
            >
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              {isAdding ? "Adding..." : "Add to Cart"}
            </Button>
          ) : item.availability === "out_of_stock" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="min-h-9 flex-1 border-glass-border sm:flex-none"
                asChild
              >
                <Link href={`/products/${item.productId}`}>
                  <Bell className="mr-1.5 h-4 w-4 text-primary" />
                  View Product
                </Link>
              </Button>
              <Badge
                variant="outline"
                className="hidden border-primary/30 text-primary sm:inline-flex"
              >
                <Heart className="mr-1 h-3 w-3 fill-primary/40" />
                Saved
              </Badge>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="min-h-9 flex-1 border-glass-border sm:flex-none"
              onClick={() => router.push("/products")}
            >
              Find similar
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="min-h-9 text-muted-foreground hover:text-primary"
            asChild
          >
            <Link href={`/products/${item.productId}`}>
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              Details
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
