import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard, Package, Shield, ShoppingBag, Truck } from "lucide-react";
import React from "react";

type CartRedirect = {
    onCheckout: () => void;
    onContinueShopping: () => void;
}

export function CartRedirect({ 
    onCheckout,
    onContinueShopping
 }: CartRedirect): React.ReactElement  {
  return (
    <div>
        {/* Actions */}
        <div className="space-y-3 mt-6">
          <Button onClick={onCheckout} className="w-full py-6 text-lg">
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
    </div>
  )
}

function Badge({ icon: Icon, text }: any) {
  return (
    <div className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {text}
    </div>
  );
}