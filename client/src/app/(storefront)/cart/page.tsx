"use client";

import { Button } from "@/components/ui/button";
import { CartCheckbox } from "@/components/storefront/cart/atoms/CartCheckbox";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { useCartStore } from "@/components/storefront/cart/state/useCartStore";
import {
  Plus,
  ShoppingCart,
  Package,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CartItem } from "@/components/storefront/cart/molecules/CartItem";
import { CartSummary } from "@/components/storefront/cart/organisms/CartSummary";
import { CartLoadingSkeleton } from "@/components/storefront/cart/atoms/CartLoadingSkeleton";
import { CartEmptyState } from "@/components/storefront/cart/organisms/CartEmptyState";
import { useCartSelection } from "@/components/storefront/cart/hooks/useCartSelection";
import { calculateCartPricingTotals } from "@/components/storefront/cart/utils/cartTotals";
import { useToast } from "@/components/ui/hooks/use-toast";

function getCartItems(items: unknown): Array<{
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  color?: string | null;
  size?: string | null;
  category?: string;
}> {
  if (Array.isArray(items)) return items;
  if (
    items &&
    typeof items === "object" &&
    "items" in items &&
    Array.isArray((items as { items: unknown[] }).items)
  ) {
    return (items as { items: typeof items }).items as ReturnType<
      typeof getCartItems
    >;
  }
  return [];
}

function UserCartPage() {
  const {
    fetchCart,
    items,
    isLoading,
    updateCartItemQuantity,
    removeFromCart,
  } = useCartStore();
  const { user } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const cartItems = getCartItems(items);
  const {
    selectedItems,
    selectedCount,
    hasSelection,
    selectAllChecked,
    toggleItem,
    toggleSelectAll,
    isSelected,
  } = useCartSelection(cartItems);

  useEffect(() => {
    setIsMounted(true);
    if (cartItems.length === 0) {
      fetchCart();
    }
  }, [fetchCart, cartItems.length]);

  useEffect(() => {
    if (isMounted && !user && !isLoading) {
      router.push("/auth/login");
    }
  }, [user, isLoading, isMounted, router]);

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating(true);
    try {
      await updateCartItemQuantity(id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    setIsUpdating(true);
    try {
      await removeFromCart(id);
    } finally {
      setIsUpdating(false);
    }
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const selectedPricing = useMemo(
    () =>
      calculateCartPricingTotals(
        selectedItems.map((item) => ({
          price: item.price,
          quantity: item.quantity,
        }))
      ),
    [selectedItems]
  );

  const handleCheckout = () => {
    if (!hasSelection) {
      toast({
        title: "No items selected",
        description: "Select at least one item to proceed to checkout.",
        variant: "destructive",
      });
      return;
    }
    router.push("/checkout");
  };

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-card/20 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <CartLoadingSkeleton />
        </div>
        </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <header className="glass-effect rounded-2xl p-6 mb-8 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-xl bg-primary/20 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Your Shopping Cart
                </h1>
                <p className="text-muted-foreground">
                  Choose items to checkout — unselected items stay in your cart
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary text-primary">
                <Package className="h-3 w-3 mr-1" />
                {itemCount} Items
              </Badge>

              <Button
                onClick={fetchCart}
                variant="outline"
                size="icon"
                className="border-border hover:border-primary"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {cartItems.length === 0 ? (
          <CartEmptyState onContinueShopping={() => router.push("/products")} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <Card className="glass-effect border border-glass-border overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card/40 px-4 py-3">
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
                    <CartCheckbox
                      checked={selectAllChecked}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all cart items"
                    />
                    <span>Select all ({cartItems.length})</span>
                  </label>
                  <Button
                    onClick={() => router.push("/products")}
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary-light"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add more
                  </Button>
                </div>

                <div className="divide-y divide-border/60">
                  {cartItems.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      selected={isSelected(item.id)}
                      onToggleSelect={toggleItem}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemoveItem}
                      isUpdating={isUpdating}
                    />
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:w-96 w-full">
              <CartSummary
                pricing={selectedPricing}
                selectedCount={selectedCount}
                totalCartCount={cartItems.length}
                checkoutDisabled={!hasSelection}
                onCheckout={handleCheckout}
                onContinueShopping={() => router.push("/products")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCartPage;
