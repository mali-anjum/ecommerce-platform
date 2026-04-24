// app/cart/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Sparkles,
  Package,
  Truck,
  Shield,
  Gift,
  RefreshCw,
  Heart,
  AlertCircle,
  CheckCircle,
  CreditCard,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CartItem } from "@/components/user/cart/CartItem";
import { CartSummary } from "@/components/user/cart/CartSummary";
import { CartLoadingSkeleton } from "@/components/user/cart/CartLoadingSkeleton";
import { CartEmptyState } from "@/components/user/cart/CartEmptyState";
import { CartRedirect } from "@/components/user/cart/CartRedirect";

function getCartItems(items: any): any[] {
  if (Array.isArray(items)) return items;
  if (items?.items && Array.isArray(items.items)) return items.items;
  if (items?.data?.items && Array.isArray(items.data.items))
    return items.data.items;
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

  useEffect(() => {
    setIsMounted(true);
    if (items.length === 0) {
      fetchCart();
    }
  }, [fetchCart, items.length]);

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

  const cartItems = getCartItems(items);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.0889; // 8% tax
  const total = subtotal + shipping + tax;

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
        {/* Header */}
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
                  Review and manage your futuristic selections
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

        {/* Main Content */}
        {cartItems.length === 0 ? (
          <CartEmptyState onContinueShopping={() => router.push("/listing")} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  Your Items ({itemCount})
                </h2>
                <Button
                  onClick={() => router.push("/products")}
                  variant="ghost"
                  className="text-primary hover:text-primary-light"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add More Items
                </Button>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    isUpdating={isUpdating}
                  />
                ))}
                <CartRedirect
                  onCheckout={() => router.push("/checkout")}
                  onContinueShopping={() => router.push("/listing")}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCartPage;
