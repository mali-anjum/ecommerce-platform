import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Package, Sparkles, Tag, TrendingUp } from "lucide-react";

type WishlistEmptyStateProps = {
  onContinueShopping: () => void;
};

export function WishlistEmptyState({ onContinueShopping }: WishlistEmptyStateProps) {
  return (
    <div className="py-12 text-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-linear-to-br from-primary/15 to-accent/15">
            <Heart className="h-16 w-16 text-primary" />
          </div>
          <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/5" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Your wishlist is empty</h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Tap the heart on any product to save it. Out-of-stock items can still be saved
            until they&apos;re back.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            onClick={onContinueShopping}
            className="bg-linear-to-r from-primary to-secondary text-primary-foreground hover:from-primary-light hover:to-secondary-light"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Start Shopping
          </Button>
          <Button variant="outline" className="border-glass-border" asChild>
            <Link href="/deals">
              <Tag className="mr-2 h-4 w-4" />
              View Deals
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="glass-effect border border-glass-border">
            <CardContent className="p-4 text-left">
              <Package className="mb-2 h-8 w-8 text-primary" />
              <h4 className="font-medium text-foreground">New arrivals</h4>
              <p className="text-sm text-muted-foreground">Latest products</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border border-glass-border">
            <CardContent className="p-4 text-left">
              <TrendingUp className="mb-2 h-8 w-8 text-secondary" />
              <h4 className="font-medium text-foreground">Trending</h4>
              <p className="text-sm text-muted-foreground">Popular picks</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border border-glass-border">
            <CardContent className="p-4 text-left">
              <Heart className="mb-2 h-8 w-8 text-accent" />
              <h4 className="font-medium text-foreground">Save for later</h4>
              <p className="text-sm text-muted-foreground">Watch prices & stock</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
