import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Row } from "@/components/ui/row";
import {
  ArrowRight,
  CreditCard,
  Gift,
  Package,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Truck
} from "lucide-react";
import type { CartSummaryProps } from "@/components/storefront/cart/types/CartSummaryProps";
import { CART_FREE_SHIPPING_THRESHOLD } from "@/components/storefront/cart/utils/cartTotals";

export function CartSummary({
  pricing,
  selectedCount,
  totalCartCount,
  checkoutDisabled = false,
  onCheckout,
  onContinueShopping,
}: CartSummaryProps) {
  const {
    subtotal,
    volumeDiscount,
    couponDiscount,
    discountedSubtotal,
    shipping,
    tax,
    total,
    itemCount,
  } = pricing;

  const discount = volumeDiscount + couponDiscount;

  return (
    <Card className="glass-effect border border-glass-border sticky top-8">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Order Summary</h3>
            <p className="text-sm text-muted-foreground">
              {itemCount} selected · {totalCartCount} in cart
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-3">
          <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />

          {discount > 0 && (
            <>
              <Row
                label={
                  <span className="flex items-center gap-1 text-success">
                    <Gift className="h-4 w-4" />
                    Discount (10%)
                  </span>
                }
                value={`- $${discount.toFixed(2)}`}
                success
              />
              <Row
                label="Discounted Subtotal"
                value={`$${discountedSubtotal.toFixed(2)}`}
              />
            </>
          )}

          <Row
            label="Shipping"
            value={shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
          />

          <Row
            label={
              <span>
                Estimated Tax
                <span className="block text-xs opacity-70">
                  calculated after discount
                </span>
              </span>
            }
            value={`$${tax.toFixed(2)}`}
          />

          <div className="h-px bg-border my-2" />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-2xl text-primary">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Free shipping progress */}
        {subtotal < CART_FREE_SHIPPING_THRESHOLD && (
          <div className="mt-6 p-3 rounded-lg border border-primary/20">
            <div className="flex justify-between text-sm">
              <span>Free shipping on orders over $100</span>
              <span className="text-primary">
                ${(CART_FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} away
              </span>
            </div>
            <div className="h-2 bg-card rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                style={{
                  width: `${(subtotal / CART_FREE_SHIPPING_THRESHOLD) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 mt-6">
          <Button
            onClick={onCheckout}
            disabled={checkoutDisabled || selectedCount === 0}
            className="w-full py-6 text-lg"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Proceed to Checkout
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <Button variant="outline" onClick={onContinueShopping} className="w-full">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Trust badges */}
        <div className="mt-6 pt-6 border-t flex justify-center gap-4 text-xs">
          <Badge icon={Shield} text="Secure Payment" />
          <Badge icon={Package} text="Free Returns" />
          <Badge icon={Truck} text="Fast Shipping" />
        </div>

      </CardContent>
    </Card>
  );
}


function Badge({ icon: Icon, text }: any) {
  return (
    <div className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {text}
    </div>
  );
}
