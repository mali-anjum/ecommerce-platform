// components/user/checkout/PaymentMethods.tsx
import { CreditCard, Lock, Shield, AlertCircle, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CheckoutPaymentMethodId } from "@/hooks/checkout/usePaymentMethods";
import { isStripePublishableConfigured } from "@/config/publicEnv";

interface PaymentMethodsProps {
  availableMethods: CheckoutPaymentMethodId[];
  methodsLoading?: boolean;
  methodsError?: string | null;
  onSelectPaymentMethod: (method: CheckoutPaymentMethodId) => void;
  isLoading?: boolean;
  isReady?: boolean;
}

const PAYMENT_OPTION_META: Record<
  CheckoutPaymentMethodId,
  {
    name: string;
    icon: string;
    description: string;
    badge: string;
    recommended: boolean;
  }
> = {
  PAYPAL: {
    name: "PayPal",
    icon: "/images/payments/paypal.svg",
    description: "Pay with PayPal account or card",
    badge: "Fast & Secure",
    recommended: true,
  },
  STRIPE: {
    name: "Credit / Debit Card",
    icon: "/images/payments/card-brands.svg",
    description: "Visa, Mastercard, Amex — secure Stripe Checkout",
    badge: "Stripe",
    recommended: false,
  },
};

export function PaymentMethods({
  availableMethods,
  methodsLoading = false,
  methodsError = null,
  onSelectPaymentMethod,
  isLoading = false,
  isReady = false,
}: PaymentMethodsProps) {
  const paymentOptions = availableMethods.map((id) => ({
    id,
    ...PAYMENT_OPTION_META[id],
  }));

  const stripeListedButClientKeyMissing =
    availableMethods.includes("STRIPE") && !isStripePublishableConfigured();

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

          {methodsLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading payment options…</span>
            </div>
          )}

          {methodsError && !methodsLoading && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{methodsError}</span>
            </div>
          )}

          {!methodsLoading && !methodsError && paymentOptions.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                No payment providers are configured. Add PayPal or Stripe keys to the server environment.
              </span>
            </div>
          )}

          {stripeListedButClientKeyMissing && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Stripe is enabled on the server but{" "}
                <code className="rounded bg-muted px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
                is missing or still a placeholder. Card checkout redirect still works; set the
                publishable key from Stripe Dashboard (Developers → API keys).
              </span>
            </div>
          )}

          <div className="space-y-3">
            {paymentOptions.map((option) => (
              <div key={option.id} className="relative">
                {option.recommended && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  </div>
                )}

                <Button
                  onClick={() => onSelectPaymentMethod(option.id)}
                  disabled={isLoading || !isReady}
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
                          !isReady
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
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
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
