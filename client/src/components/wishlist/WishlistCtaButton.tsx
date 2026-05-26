"use client";

import { useCallback } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useToast } from "@/hooks/use-toast";
import type { WishlistProductSnapshot } from "@/types/wishlist/wishlistTypes";
import { cn } from "@/lib/utils";

type WishlistCtaButtonProps = {
  productId: string;
  snapshot: WishlistProductSnapshot;
  className?: string;
  size?: "default" | "lg";
};

export function WishlistCtaButton({
  productId,
  snapshot,
  className,
  size = "lg",
}: WishlistCtaButtonProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist, isToggling } = useWishlistStore();

  const saved = isInWishlist(productId);
  const busy = Boolean(isToggling[productId]);

  const handleClick = useCallback(async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const result = await toggleWishlist(productId, snapshot);
    if (!result) {
      toast({
        title: "Could not update wishlist",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title:
        result.action === "added"
          ? "Added to your wishlist"
          : "Removed from wishlist",
      description: snapshot.name,
    });
  }, [user, router, toggleWishlist, productId, snapshot, toast]);

  return (
    <Button
      type="button"
      size={size}
      disabled={busy}
      onClick={() => void handleClick()}
      className={cn(
        "w-full font-semibold shadow-sm transition-all",
        saved
          ? "border border-glass-border bg-muted text-foreground hover:bg-muted/80"
          : "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary-light hover:to-secondary-light neon-border",
        size === "lg" && "rounded-xl py-6 text-lg",
        className
      )}
    >
      {busy ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Please wait...
        </>
      ) : saved ? (
        <>
          <Heart className="mr-2 h-5 w-5 fill-current text-primary" />
          IN WISHLIST — TAP TO REMOVE
        </>
      ) : (
        <>
          <Heart className="mr-2 h-5 w-5" />
          ADD TO WISHLIST
        </>
      )}
    </Button>
  );
}
