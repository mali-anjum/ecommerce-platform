// components/user/checkout/OrderSummary.tsx
import { Coupon } from "@/types/checkout/Coupon";
import { CartItemWithProduct } from "@/types/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Gift, Package, Percent, Shield, ShoppingBag, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface CheckoutOrderSummaryProps {
  cartItems: CartItemWithProduct[];
  subtotal: number;
  discountAmount: number;
  total: number;
  couponCode: string;
  appliedCoupon: Coupon | null;
  couponError: string;
  onCouponChange: (code: string) => void;
  onApplyCoupon: () => void;
  isCheckoutReady?: boolean;
}

const TAX_RATE = 0.0889;
const DISCOUNT_THRESHOLD = 100;
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 9.99;

export function OrderSummary({ 
  cartItems, 
  subtotal, 
  discountAmount, // ?  
  total, // ?
  couponCode, 
  appliedCoupon, 
  couponError,
  onCouponChange,
  onApplyCoupon,
  isCheckoutReady = true
}: CheckoutOrderSummaryProps) {
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

   const discount =
    subtotal >= DISCOUNT_THRESHOLD ? subtotal * 0.1 : 0;

  const discountedSubtotal = subtotal - discount;

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  const tax = discountedSubtotal * TAX_RATE;
console.log("The tax is:", tax);
  // const total = discountedSubtotal + shipping + tax
console.log(total);
  return (
    <Card className="glass-effect border border-glass-border sticky top-8">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Order Summary</h3>
            <p className="text-sm text-muted-foreground">{itemCount} items in order</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-card">
              <div className="relative">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                  {item.product.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {item.quantity > 1 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                    x{item.quantity}
                  </Badge>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">
                  {item.product.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {item.color && (
                    <Badge variant="outline" className="text-xs border-border">
                      {item.color}
                    </Badge>
                  )}
                  {item.size && (
                    <Badge variant="outline" className="text-xs border-border">
                      Size: {item.size}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Qty: {item.quantity}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-primary">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${item.product.price.toFixed(2)} each
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon Section */}
        <div className="mb-6">
          <Label className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4" />
            Discount Code
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => onCouponChange(e.target.value)}
              className="bg-input border-border"
              disabled={!isCheckoutReady}
            />
            <Button 
              onClick={onApplyCoupon} 
              variant="outline" 
              className="border-border hover:border-primary"
              disabled={!isCheckoutReady}
            >
              Apply
            </Button>
          </div>
          
          {couponError && (
            <div className="mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{couponError}</p>
            </div>
          )}
          
          {appliedCoupon && (
            <div className="mt-2 p-2 rounded-lg bg-success/10 border border-success/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">
                    {appliedCoupon.code} Applied
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appliedCoupon.discountPercent}% discount
                  </p>
                </div>
              </div>
              <Badge className="bg-success/20 text-success border-success/20">
                -${discountAmount.toFixed(2)}
              </Badge>
            </div>
          )}
        </div>

        {/* Order Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          {appliedCoupon && (
            <div className="flex items-center justify-between text-success">
              <span className="flex items-center gap-1">
                <Percent className="h-4 w-4" />
                Discount ({appliedCoupon.discountPercent}%)
              </span>
              <span className="font-medium">-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? (
                <span className="text-success">FREE</span>
              ) : (
                `$${shipping.toFixed(2)}`
              )}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-2xl text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Free Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Fast Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Quality Guaranteed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}