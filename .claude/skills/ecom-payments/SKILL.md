---
name: ecom-payments
description: Rules for changing checkout, orders, coupons, Stripe, PayPal, or payment webhooks in this repo. Covers server-side totals, idempotent capture, webhook signature verification, payment feature flags, and what must be tested manually. Use for any change in services/payment, services/order, webhook.controller.ts, orderController.ts, coupons, or client checkout.
---

# Payments and checkout

Money paths are the highest-risk code in this app. Be strict.

## Where things are

| Concern | File |
|---|---|
| Provider abstraction | `server/src/services/payment/{payment.service,payment.factory,base.payment.service}.ts` |
| Providers | `server/src/services/payment/providers/{stripe,paypal,card}.service.ts` |
| Enabled methods (flags) | `server/src/services/payment/paymentMethod.ts` (`payments.enabled`, `payments.stripe`, `payments.paypal`) |
| Checkout totals | `server/src/services/cart/checkoutTotals.ts`, `validateCheckoutSelection.ts` |
| Webhooks | `server/src/controllers/webhook.controller.ts` (mounted without JWT, raw body) |
| Orders | `server/src/controllers/orderController.ts`, `server/src/services/order/` |
| Client checkout | `client/src/components/storefront/checkout/` |

Consult `stripe-best-practices` for API choices and `upgrade-stripe` before bumping the Stripe SDK/API version.

## Non-negotiable rules

1. **Server computes the amount.** Totals, discounts, coupons, shipping and currency come from DB values in `checkoutTotals.ts`. Ignore any client-sent price or total.
2. **Webhooks verify signatures first.** Stripe: `stripe.webhooks.constructEvent` on the raw body with `STRIPE_WEBHOOK_SECRET`. PayPal: `verifyWebhookSignature` with `PAYPAL_WEBHOOK_ID`. Reject (400) on failure; never "log and continue".
3. **Idempotent.** Capture and webhook handlers may run more than once (retries, double clicks, webhook + return-page race). Check current order/payment status before changing it; never double-capture, double-decrement stock, or double-apply a coupon. See `providers/__tests__/paypal.service.test.ts` ("capture idempotency").
4. **Atomic state changes.** Order status + payment record + stock + coupon usage update in one `prisma.$transaction`.
5. **Ownership.** A user can only pay for / view their own order; admins via `isSuperAdmin`.
6. **No sensitive logging.** Never log card data, full provider payloads, client secrets, or webhook secrets. Log order id, provider id, status.
7. **Respect flags.** A disabled method must be rejected server-side, not just hidden in the UI.
8. Keep secrets in env (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`); only publishable keys may reach the client.

## Tests (required)

Mock the provider SDKs (see `stripe.service.test.ts`, `paypal.service.test.ts`) and cover: correct amount from DB, tampered client amount ignored, invalid webhook signature rejected, duplicate webhook/capture is a no-op, disabled provider rejected, other user's order → 403/404.

## Always report as unverified unless done

A real sandbox checkout (Stripe test card `4242 4242 4242 4242`, PayPal sandbox account) and a real webhook delivery (`stripe listen --forward-to localhost:4001/api/order/webhooks/stripe`). Say so explicitly in the final report.

Then run `ecom-verify`.
