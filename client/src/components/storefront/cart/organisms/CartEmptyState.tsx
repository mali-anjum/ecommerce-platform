import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Package, ShoppingCart, Sparkles, TrendingUp, Zap } from "lucide-react";

export function CartEmptyState({ onContinueShopping }: { onContinueShopping: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <ShoppingCart className="h-16 w-16 text-primary" />
          </div>
          <div className="absolute -inset-4 rounded-full bg-primary/5 animate-pulse"></div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground">
            Add some futuristic products to get started
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={onContinueShopping}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-primary-foreground"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Start Shopping
          </Button>
          
          <Button variant="outline" className="border-border">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Trending
          </Button>
        </div>
        
        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-effect border border-glass-border">
            <CardContent className="p-4">
              <Package className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium text-foreground">New Arrivals</h4>
              <p className="text-sm text-muted-foreground">Latest futuristic products</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border border-glass-border">
            <CardContent className="p-4">
              <Zap className="h-8 w-8 text-secondary mb-2" />
              <h4 className="font-medium text-foreground">Best Sellers</h4>
              <p className="text-sm text-muted-foreground">Most popular items</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border border-glass-border">
            <CardContent className="p-4">
              <Gift className="h-8 w-8 text-accent mb-2" />
              <h4 className="font-medium text-foreground">Special Offers</h4>
              <p className="text-sm text-muted-foreground">Exclusive discounts</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

