import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CartCheckbox } from "@/components/storefront/cart/atoms/CartCheckbox";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Minus, Plus, Trash2 } from "lucide-react";
import type { CartItemProps } from "@/types/cart/CartItemProps";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useToast } from "@/components/ui/hooks/use-toast";

export function CartItem({
  item,
  selected,
  onToggleSelect,
  onUpdateQuantity,
  onRemove,
  isUpdating,
}: CartItemProps) {
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { toast } = useToast();
  const saved = isInWishlist(item.productId);

  const handleSaveForLater = async () => {
    const result = await toggleWishlist(item.productId, {
      productId: item.productId,
      name: item.name,
      category: item.category ?? "General",
      thumbnail: item.image ?? null,
      price: item.price,
    });
    if (result?.action === "added") {
      await onRemove(item.id);
      toast({
        title: "Saved for later",
        description: `${item.name} moved to your wishlist.`,
      });
    }
  };

  return (
    <div
      className={`transition-colors ${
        selected ? "bg-primary/5" : "bg-transparent opacity-95"
      }`}
    >
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-20 w-9 shrink-0 items-center justify-center pt-1">
            <CartCheckbox
              checked={selected}
              onCheckedChange={() => onToggleSelect(item.id)}
              aria-label={`Select ${item.name} for checkout`}
            />
          </div>

          {/* Product Image */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-md overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 border border-border/60">
              <img
                src={item.image ?? "/placeholder-product.png"}
                alt={item.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            {item.quantity > 1 && (
              <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                x{item.quantity}
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="font-bold text-foreground text-lg line-clamp-1">
                  {item.name}
                </h3>
                
                <div className="flex items-center gap-4 text-sm">
                  {item.color && (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border border-border" 
                           style={{ backgroundColor: item.color.toLowerCase() }} />
                      <span className="text-muted-foreground">{item.color}</span>
                    </div>
                  )}
                  
                  {item.size && (
                    <Badge variant="outline" className="border-border">
                      Size: {item.size}
                    </Badge>
                  )}
                </div>

                {/* Price Display */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        ${item.originalPrice.toFixed(2)}
                      </span>
                      <Badge className="bg-accent/20 text-accent border-accent/20">
                        Save ${(item.originalPrice - item.price).toFixed(2)}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    disabled={isUpdating || item.quantity <= 1}
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-border hover:border-primary"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <div className="relative">
                    <Input
                      type="number"
                      className="w-16 text-center bg-input border-border"
                      value={item.quantity}
                      onChange={(e) => 
                        onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      min="1"
                      max="99"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <span className="text-xs text-muted-foreground">qty</span>
                    </div>
                  </div>
                  
                  <Button
                    disabled={isUpdating}
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-border hover:border-primary"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          disabled={isUpdating}
                          onClick={() => onRemove(item.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove from cart</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isUpdating || saved}
                          onClick={() => void handleSaveForLater()}
                        >
                          <Heart
                            className={`h-4 w-4 ${saved ? "fill-current text-destructive" : ""}`}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{saved ? "Already in wishlist" : "Save for later"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Item Total */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Item Total</span>
              <span className="text-xl font-bold text-primary">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
    </div>
  );
}