"use client";

import { Bell, Heart, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type HeaderDesktopQuickActionsProps = {
  wishlistCount: number;
  cartCount: number;
};

/** Desktop icon buttons: wishlist, cart, notifications. */
export function HeaderDesktopQuickActions({
  wishlistCount,
  cartCount,
}: HeaderDesktopQuickActionsProps) {
  const router = useRouter();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/wishlist")}
        className="relative rounded-full"
      >
        <Heart className="h-5 w-5" />
        {wishlistCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
            {wishlistCount}
          </span>
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/cart")}
        className="relative rounded-full"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {cartCount}
        </span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/notifications")}
        className="relative rounded-full"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">
          5
        </span>
      </Button>
    </>
  );
}
