import type { PaymentMethod as PrismaPaymentMethod } from "@prisma/client";

export type CheckoutPaymentMethod = "PAYPAL" | "STRIPE";

export function isPayPalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID?.trim() &&
      process.env.PAYPAL_CLIENT_SECRET?.trim() &&
      process.env.PAYPAL_RETURN_URL?.trim() &&
      process.env.PAYPAL_CANCEL_URL?.trim()
  );
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Methods exposed to checkout after env validation. */
export function getAvailablePaymentMethods(): CheckoutPaymentMethod[] {
  const methods: CheckoutPaymentMethod[] = [];
  if (isPayPalConfigured()) {
    methods.push("PAYPAL");
  }
  if (isStripeConfigured()) {
    methods.push("STRIPE");
  }
  return methods;
}

/**
 * Normalizes client/API input. Legacy CARD/CREDIT_CARD map to Stripe Checkout.
 */
export function normalizePaymentMethod(raw: unknown): CheckoutPaymentMethod | null {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase();

  if (value === "PAYPAL") {
    return "PAYPAL";
  }

  if (value === "STRIPE" || value === "CARD" || value === "CREDIT_CARD") {
    return "STRIPE";
  }

  return null;
}

export function toPrismaPaymentMethod(
  method: CheckoutPaymentMethod
): PrismaPaymentMethod {
  return method;
}
