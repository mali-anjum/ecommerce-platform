// components/user/checkout/PaymentMethods.tsx
import { CreditCard, Lock, Shield, AlertCircle, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PaymentMethodsProps {
  onSelectPaymentMethod: (method: "PAYPAL" | "STRIPE" | "CARD") => void;
  isLoading?: boolean;
  isReady?: boolean;
}

export function PaymentMethods({
  onSelectPaymentMethod,
  isLoading = false,
  isReady = false,
}: PaymentMethodsProps) {
  type PaymentOption = {
    id: "PAYPAL" | "STRIPE" | "CARD";
    name: string;
    icon: string;
    description: string;
    badge: string;
    recommended: boolean;
    disabled?: boolean;
  };

  const paymentOptions: PaymentOption[] = [
    {
      id: "PAYPAL" as const,
      name: "PayPal",
      icon: "/images/payments/paypal.svg",
      description: "Pay with PayPal account or card",
      badge: "Fast & Secure",
      recommended: true,
    },
    {
      id: "STRIPE" as const,
      name: "Credit/Debit Card",
      icon: "/images/payments/card-brands.svg",
      description: "Visa, Mastercard, American Express",
      badge: "3D Secure",
      recommended: false,
    },
    {
      id: "CARD" as const,
      name: "Direct Card",
      icon: "/images/payments/direct-card.svg",
      description: "Process card directly",
      badge: "Beta",
      recommended: false,
      disabled: true,
    },
  ];

  return (
    <Card className="glass-effect border border-glass-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Payment Method
            </h3>
            <p className="text-sm text-muted-foreground">
              {isReady ? "Choose how you'd like to pay" : "Complete shipping info first"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Security Badge */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-success" />
                <span className="font-medium text-foreground">
                  Secure Payment
                </span>
              </div>
              <Badge className="bg-success/20 text-success border-success/20">
                <Shield className="h-3 w-3 mr-1" />
                PCI DSS Compliant
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              All transactions are encrypted and secure. Your payment information is never stored.
            </p>
          </div>

          {/* Payment Options */}
          <div className="space-y-3">
            {paymentOptions.map((option) => (
              <div key={option.id} className="relative">
                {option.recommended && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  </div>
                )}
                
                <Button
                  onClick={() => !option.disabled && onSelectPaymentMethod(option.id)}
                  disabled={option.disabled || isLoading || !isReady}
                  variant="outline"
                  className="h-auto w-full justify-start border-2 p-4 transition-all hover:border-primary"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-14 items-center justify-center rounded-md border bg-white/95">
                        <img
                          src={option.icon}
                          alt={`${option.name} logo`}
                          className="h-6 w-12 object-contain"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-foreground">
                          {option.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                    {option.badge && (
                      <Badge
                        variant="secondary"
                        className={
                          option.disabled || !isReady
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        }
                      >
                        {option.badge}
                      </Badge>
                    )}
                  </div>
                </Button>
              </div>
            ))}
          </div>

          {/* Terms & Support */}
          <div className="pt-4 border-t border-border space-y-4">
            <p className="text-xs text-muted-foreground">
              By completing your purchase you agree to our{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
            
            {!isReady && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>Please complete shipping information first</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}