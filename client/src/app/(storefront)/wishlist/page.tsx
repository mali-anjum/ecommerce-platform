"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  Heart,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { useWishlistStore } from "@/components/storefront/wishlist/state/useWishlistStore";
import { WishlistItemCard } from "@/components/storefront/wishlist/molecules/WishlistItemCard";
import { WishlistSummary } from "@/components/storefront/wishlist/molecules/WishlistSummary";
import { WishlistLoadingSkeleton } from "@/components/storefront/wishlist/atoms/WishlistLoadingSkeleton";
import { WishlistEmptyState } from "@/components/storefront/wishlist/organisms/WishlistEmptyState";
import { getDisplayPrice } from "@/components/products/utils/productPricing";

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, isLoading, error, fetchWishlist } = useWishlistStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !user) {
      router.push("/auth/login");
    }
  }, [isMounted, router, user]);

  useEffect(() => {
    if (user) {
      void fetchWishlist();
    }
  }, [user, fetchWishlist]);

  const inStockCount = useMemo(
    () => items.filter((i) => i.isPurchasable).length,
    [items]
  );

  const outOfStockCount = useMemo(
    () => items.filter((i) => !i.isPurchasable).length,
    [items]
  );

  const totalValue = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + getDisplayPrice({ price: item.price, salePrice: item.salePrice }),
        0
      ),
    [items]
  );

  if (!isMounted || !user) return null;

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-card/20 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header — matches cart page */}
        <header className="glass-effect mb-8 rounded-2xl border border-glass-border p-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent">
                  <Heart className="h-6 w-6 fill-white/20 text-white" />
                </div>
                <div className="absolute -inset-2 animate-pulse rounded-xl bg-primary/20" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
                <p className="text-muted-foreground">
                  Saved across devices · live price & stock on refresh
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isLoading && items.length > 0 && (
                <>
                  <Badge
                    variant="outline"
                    className="border-primary text-primary"
                  >
                    <Heart className="mr-1 h-3 w-3" />
                    {items.length} saved
                  </Badge>
                  <Badge variant="outline" className="border-border">
                    <Sparkles className="mr-1 h-3 w-3" />
                    ${totalValue.toFixed(2)} est.
                  </Badge>
                </>
              )}
              <Button
                onClick={() => void fetchWishlist()}
                variant="outline"
                size="icon"
                className="border-border hover:border-primary"
                aria-label="Refresh wishlist"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="border-glass-border hover:border-primary hover:text-primary"
                asChild
              >
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Shop more
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="flex-1 text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void fetchWishlist()}>
              Retry
            </Button>
          </div>
        )}

        {isLoading ? (
          <WishlistLoadingSkeleton />
        ) : items.length === 0 ? (
          <WishlistEmptyState onContinueShopping={() => router.push("/products")} />
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* List — Daraz / AliExpress row layout inside themed card */}
            <div className="flex-1">
              <Card className="glass-effect overflow-hidden border border-glass-border">
                <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card/40 px-4 py-3 sm:px-5">
                  <p className="text-sm font-medium text-foreground">
                    All items ({items.length})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inStockCount} ready to buy
                  </p>
                </div>
                <div>
                  {items.map((item) => (
                    <WishlistItemCard key={item.id} item={item} />
                  ))}
                </div>
              </Card>
            </div>

            <div className="w-full lg:w-96">
              <WishlistSummary
                totalItems={items.length}
                inStockCount={inStockCount}
                outOfStockCount={outOfStockCount}
                totalValue={totalValue}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
