// controllers/payment/webhook.controller.ts
import type { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { PaymentFactory } from "../services/payment/payment.factory";
import { normalizePaymentMethod } from "../services/payment/paymentMethod";
import {
  FULFILLED_ORDER_STATUSES,
  applyPurchaseFulfillment,
  buildFulfillmentAnalyticsContext,
  claimOrderForFulfillment,
  parsePurchasedCartItemIds,
} from "../services/order";
import { sentryTracker } from "../lib/monitoring";

type WebhookResult = {
  success: boolean;
  event?: string;
  data?: any;
  error?: string;
};

type PaymentWithOrder = Prisma.PaymentGetPayload<{
  include: { order: { include: { items: true } } };
}>;

/**
 * Exact request bytes for signature verification. `express.json` stores them on
 * `req.rawBody` (see server.ts); re-serialising the parsed body breaks Stripe signatures.
 */
export function getRawBody(req: Request): string {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody.toString("utf8");
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;
  return JSON.stringify(req.body ?? {});
}

function headerValue(req: Request, name: string): string {
  const value = req.headers[name];
  return typeof value === "string" ? value : "";
}

/** Verifies PayPal's transmission signature. Missing headers fail verification. */
async function verifyPayPalRequest(req: Request, rawBody: string): Promise<boolean> {
  const paymentService = PaymentFactory.createPaymentService("PAYPAL");
  return paymentService.verifyWebhookSignature(
    rawBody,
    headerValue(req, "paypal-transmission-sig"),
    headerValue(req, "paypal-transmission-time"),
    headerValue(req, "paypal-cert-url"),
    headerValue(req, "paypal-transmission-id")
  );
}

async function dispatchPayPalEvent(result: WebhookResult) {
  switch (result.event) {
    case "payment_captured":
      await handlePayPalPaymentCaptured(result.data);
      break;
    case "order_approved":
      await handlePayPalOrderApproved(result.data);
      break;
    case "payment_failed":
      await handlePaymentFailed("PAYPAL", result.data);
      break;
  }
}

async function dispatchStripeEvent(result: WebhookResult) {
  if (result.success && result.event === "payment_success") {
    await handleStripePaymentSuccess(result.data);
  } else if (!result.success && result.event === "payment_failed") {
    await handlePaymentFailed("STRIPE", result.data);
  }
}

async function processPayPal(req: Request, res: Response) {
  const rawBody = getRawBody(req);
  if (!(await verifyPayPalRequest(req, rawBody))) {
    console.error("Invalid PayPal webhook signature");
    return res.status(400).send("Invalid signature");
  }

  const paymentService = PaymentFactory.createPaymentService("PAYPAL");
  const result: WebhookResult = await paymentService.handleWebhook(rawBody, "");
  await dispatchPayPalEvent(result);
  return res.status(200).send("Webhook processed");
}

async function processStripe(req: Request, res: Response) {
  const paymentService = PaymentFactory.createPaymentService("STRIPE");
  const result: WebhookResult = await paymentService.handleWebhook(
    getRawBody(req),
    headerValue(req, "stripe-signature")
  );

  // `error` is only set when constructEvent rejected the payload (bad signature / no secret).
  if (result.error) {
    console.error("Invalid Stripe webhook:", result.error);
    return res.status(400).send("Invalid signature");
  }

  await dispatchStripeEvent(result);
  return res.status(200).send("Webhook processed");
}

// PayPal-specific webhook handler
export const paypalWebhook = async (req: Request, res: Response) => {
  try {
    await processPayPal(req, res);
  } catch (error) {
    sentryTracker(error, { source: "webhook.controller" });
    console.error("Error processing PayPal webhook:", error);
    res.status(500).send("Internal server error");
  }
};

// Stripe-specific webhook handler
export const stripeWebhook = async (req: Request, res: Response) => {
  try {
    await processStripe(req, res);
  } catch (error) {
    sentryTracker(error, { source: "webhook.controller" });
    console.error("Error processing Stripe webhook:", error);
    res.status(500).send("Internal server error");
  }
};

// Generic webhook handler: same verification rules as the provider-specific routes.
export const genericWebhook = async (req: Request, res: Response) => {
  try {
    const provider = normalizePaymentMethod(
      String(req.params.provider ?? req.headers["x-payment-provider"] ?? "")
    );

    if (provider === "PAYPAL") {
      await processPayPal(req, res);
      return;
    }
    if (provider === "STRIPE") {
      await processStripe(req, res);
      return;
    }

    res.status(400).send("Unsupported payment provider");
  } catch (error) {
    sentryTracker(error, { source: "webhook.controller" });
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal server error");
  }
};

async function handlePayPalOrderApproved(resource: any) {
  const paypalOrderId = resource?.resource?.id ?? resource?.id;

  if (!paypalOrderId) return;

  const payments = await prisma.payment.findMany({
    where: {
      providerReferenceId: paypalOrderId,
      order: { status: "PENDING_PAYMENT" },
    },
  });

  for (const p of payments) {
    await prisma.order.update({
      where: { id: p.orderId },
      data: {
        status: "PAYMENT_APPROVED",
        paymentStatus: "APPROVED",
        updatedAt: new Date(),
      },
    });
    await prisma.payment.update({
      where: { id: p.id },
      data: { attemptStatus: "AUTHORIZED" },
    });
  }
}

/**
 * Records the capture and, only for the first successful delivery, applies stock,
 * cart and coupon fulfillment. Duplicate webhooks and the return-page capture race
 * are resolved by `claimOrderForFulfillment`.
 */
async function completePayment(payment: PaymentWithOrder, captureId: string) {
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      attemptStatus: "COMPLETED",
      providerCaptureId: captureId,
      capturedAt: new Date(),
    },
  });

  const order = payment.order;
  const claimed = await claimOrderForFulfillment(order.id);
  if (!claimed) return;

  await applyPurchaseFulfillment(
    order.userId,
    order.items,
    parsePurchasedCartItemIds(payment.metadata),
    buildFulfillmentAnalyticsContext(order, payment.metadata),
  );

  if (order.couponId) {
    await prisma.coupon.update({
      where: { id: order.couponId },
      data: { usageCount: { increment: 1 } },
    });
  }
}

async function handlePayPalPaymentCaptured(event: any) {
  const capture = event?.resource ?? event;
  const captureId = capture?.id;
  const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id;

  if (!captureId || !paypalOrderId) return;

  const payment = await prisma.payment.findFirst({
    where: { providerReferenceId: paypalOrderId },
    include: { order: { include: { items: true } } },
  });

  if (!payment?.order?.items?.length) return;
  await completePayment(payment, captureId);
}

async function handleStripePaymentSuccess(session: any) {
  const sessionId = session?.id;
  const metadata = session?.metadata;

  if (session?.payment_status && session.payment_status !== "paid") return;

  let payment: PaymentWithOrder | null = sessionId
    ? await prisma.payment.findFirst({
        where: { providerReferenceId: sessionId },
        include: { order: { include: { items: true } } },
      })
    : null;

  if (!payment && metadata?.internalOrderId) {
    payment = await prisma.payment.findFirst({
      where: { orderId: metadata.internalOrderId },
      orderBy: { createdAt: "desc" },
      include: { order: { include: { items: true } } },
    });
  }

  if (!payment?.order?.items?.length) return;
  await completePayment(payment, sessionId);
}

async function handlePaymentFailed(provider: "PAYPAL" | "STRIPE", data: any) {
  const resource = provider === "PAYPAL" ? (data?.resource ?? data) : data;
  const providerOrderId: string | undefined =
    provider === "PAYPAL"
      ? resource?.supplementary_data?.related_ids?.order_id
      : resource?.id;
  const internalOrderId: string | undefined =
    provider === "STRIPE" ? resource?.metadata?.internalOrderId : undefined;

  const orderId =
    internalOrderId ??
    (providerOrderId
      ? (
          await prisma.payment.findFirst({
            where: { providerReferenceId: providerOrderId },
            select: { orderId: true },
          })
        )?.orderId
      : undefined);

  if (!orderId) return;

  // A late failure event must never downgrade an order that was already paid.
  const { count } = await prisma.order.updateMany({
    where: {
      id: orderId,
      status: { notIn: FULFILLED_ORDER_STATUSES },
      paymentStatus: { notIn: ["COMPLETED", "REFUNDED"] },
    },
    data: {
      status: "PAYMENT_FAILED",
      paymentStatus: "FAILED",
    },
  });
  if (count === 0) return;

  await prisma.payment.updateMany({
    where: {
      orderId,
      attemptStatus: { in: ["PENDING", "AUTHORIZED"] },
    },
    data: { attemptStatus: "FAILED" },
  });
}
