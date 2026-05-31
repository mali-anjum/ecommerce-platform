import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const CheckoutSecurityCard = () => {
  return (
    <Card className="glass-effect border border-glass-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-success" />
          <div>
            <h4 className="font-medium text-foreground">Secure Checkout</h4>
            <p className="text-sm text-muted-foreground">
              Your payment is encrypted and secure. We never store your
              card details.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};