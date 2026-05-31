import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Row } from "@/components/ui/row";
import {
  ArrowRight,
  Heart,
  Package,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

type WishlistSummaryProps = {
  totalItems: number;
  inStockCount: number;
  outOfStockCount: number;
  totalValue: number;
};

export function WishlistSummary({
  totalItems,
  inStockCount,
  outOfStockCount,
  totalValue,
}: WishlistSummaryProps) {
  return (
    <Card className="glass-effect sticky top-8 border border-glass-border">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Heart className="h-5 w-5 fill-primary/30 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Wishlist Summary</h3>
            <p className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"} saved
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Row label="In stock" value={String(inStockCount)} />
          <Row label="Out of stock" value={String(outOfStockCount)} />
          <div className="border-t border-border/60 pt-3">
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Estimated value</span>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ${totalValue.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Prices update when you open this page
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {inStockCount > 0 ? (
            <Button
              asChild
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary-light hover:to-secondary-light neon-border"
            >
              <Link href="/cart">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Go to Cart
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              disabled
              className="w-full"
              variant="outline"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nothing in stock yet
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            className="w-full border-glass-border hover:border-primary hover:text-primary"
          >
            <Link href="/products">
              <Sparkles className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Package className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span> Save
              out-of-stock items here — we&apos;ll show live stock when you return.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
