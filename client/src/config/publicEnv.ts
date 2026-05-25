/**
 * Browser-safe env (NEXT_PUBLIC_*). Server-only vars belong in route handlers via getServerBackendUrl().
 */

const trim = (value: string | undefined) => value?.trim() ?? "";

export const publicEnv = {
  apiUrl: trim(process.env.NEXT_PUBLIC_API_URL) || "http://localhost:4001",
  appName: trim(process.env.NEXT_PUBLIC_APP_NAME) || "Next E-Commerce",
  appEnv:
    trim(process.env.NEXT_PUBLIC_APP_ENV) ||
    process.env.NODE_ENV ||
    "development",
  /** Site origin for checkout return routes (align with server STRIPE_CHECKOUT_BASE_URL). */
  appUrl: trim(process.env.NEXT_PUBLIC_APP_URL) || "http://localhost:3012",
  logLevel: trim(process.env.NEXT_PUBLIC_LOG_LEVEL) || "info",
  paypalClientId: trim(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID),
  paypalLocale: trim(process.env.NEXT_PUBLIC_PAYPAL_LOCALE) || "en_US",
  stripePublishableKey: trim(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
} as const;

export function isPayPalSdkConfigured(): boolean {
  const id = publicEnv.paypalClientId;
  return id.length > 0 && !id.includes("your_") && !id.includes("xxx");
}

export function isStripePublishableConfigured(): boolean {
  const key = publicEnv.stripePublishableKey;
  return (
    key.length > 0 &&
    (key.startsWith("pk_test_") || key.startsWith("pk_live_")) &&
    !key.includes("your_stripe")
  );
}
