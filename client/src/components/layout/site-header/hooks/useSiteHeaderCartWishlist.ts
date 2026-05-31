"use client";

import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { useCartStore } from "@/components/storefront/cart/state/useCartStore";
import { useWishlistStore } from "@/components/storefront/wishlist/state/useWishlistStore";
import { useEffect } from "react";

/** Loads cart and wishlist counts when the user is signed in. */
export function useSiteHeaderCartWishlist() {
  const user = useAuthStore((s) => s.user);
  const { fetchCart, items: cartItems } = useCartStore();
  const { fetchWishlist, items: wishlistItems } = useWishlistStore();

  useEffect(() => {
    if (!user || cartItems.length > 0) return;
    fetchCart();
  }, [fetchCart, user, cartItems.length]);

  useEffect(() => {
    if (!user || wishlistItems.length > 0) return;
    void fetchWishlist();
  }, [fetchWishlist, user, wishlistItems.length]);

  return {
    cartCount: cartItems?.length ?? 0,
    wishlistCount: wishlistItems.length,
  };
}
