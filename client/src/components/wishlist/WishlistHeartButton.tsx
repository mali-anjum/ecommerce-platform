"use client";

import { useCallback } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useToast } from "@/hooks/use-toast";
import type { WishlistProductSnapshot } from "@/types/wishlist/wishlistTypes";
import { cn } from "@/lib/utils";

type WishlistHeartButtonProps = {
  productId: string;
  snapshot: WishlistProductSnapshot;
  className?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  stopPropagation?: boolean;
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
};

export function WishlistHeartButton({
  productId,
  snapshot,
  className,
  size = "md",
  showTooltip = true,
  stopPropagation = true,
}: WishlistHeartButtonProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist, isToggling } = useWishlistStore();

  const saved = isInWishlist(productId);
  const busy = Boolean(isToggling[productId]);

  const handleClick = useCallback(
    async (event: React.MouseEvent) => {
      if (stopPropagation) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const result = await toggleWishlist(productId, snapshot);
      if (!result) {
        toast({
          title: "Wishlist update failed",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: result.action === "added" ? "Saved to wishlist" : "Removed from wishlist",
        description: snapshot.name,
      });
    },
    [
      user,
      router,
      toggleWishlist,
      productId,
      snapshot,
      toast,
      stopPropagation,
    ]
  );

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        sizeClasses[size],
        "rounded-full bg-background/80 backdrop-blur-sm border border-border/60 shadow-sm hover:bg-background",
        saved && "text-destructive hover:text-destructive",
        className
      )}
      onClick={handleClick}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn("h-4 w-4 transition-colors", saved && "fill-current")}
        />
      )}
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{saved ? "Remove from wishlist" : "Save to wishlist"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
