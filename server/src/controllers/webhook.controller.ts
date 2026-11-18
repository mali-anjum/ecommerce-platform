// controllers/payment/webhook.controller.ts
import type { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { PaymentFactory } from "../services/payment/payment.factory";
import {
  applyPurchaseFulfillment,
  buildFulfillmentAnalyticsContext,
  parsePurchasedCartItemIds,
} from "../services/order/fulfillment";
import { sentryTracker } from "../lib/monitoring";

const orderIncludeWithItems: Prisma.OrderInclude = {
  items: true,
  payments: { orderBy: { createdAt: "desc" }, take: 5 },
};

/** Resolve an order using internal id and/or provider payment reference (PayPal order id, Stripe session id). */
async function findOrderByIdentifiers(
  providerReferenceId?: string,
  internalOrderId?: string,
  legacyPaymentId?: string,
  includeItems: boolean = true
) {
  const ref = providerReferenceId || legacyPaymentId;
  const include = includeItems
    ? orderIncludeWithItems
    : { payments: { orderBy: { createdAt: "desc" as const }, take: 5 } };

  if (internalOrderId) {
    const order = await prisma.order.findUnique({
      where: { id: internalOrderId },
      include,
    });
    if (order) return order;
  }

  if (ref) {
    const order = await prisma.order.findFirst({
      where: {
        payments: {
          some: { providerReferenceId: ref },
        },
      },
      include,
    });
    if (order) return order;
  }

  return null;
}

// PayPal-specific webhook handler
export const paypalWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["paypal-transmission-sig"] as string;
    const transmissionId = req.headers["paypal-transmission-id"] as string;
    const timestamp = req.headers["paypal-transmission-time"] as string;
    const certUrl = req.headers["paypal-cert-url"] as string;

    const paymentService = PaymentFactory.createPaymentService("PAYPAL");

    const rawBody = JSON.stringify(req.body);

    const isValid = await paymentService.verifyWebhookSignature(
      rawBody,
      signature,
      timestamp,
      certUrl,
      transmissionId
    );

    if (!isValid) {
      console.error("Invalid PayPal webhook signature");
      return res.status(400).send("Invalid signature");
    }

    const result = await paymentService.handleWebhook(rawBody, signature);

    if (result.success) {
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

    res.status(200).send("Webhook processed");
  } catch (error) {
    sentryTracker(error, { source: "webhook.controller" });
    console.error("Error processing PayPal webhook:", error);
    res.status(500).send("Internal server error");
  }
};

// Stripe-specific webhook handler
export const stripeWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;

    const paymentService = PaymentFactory.createPaymentService("STRIPE");

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const result = await paymentService.handleWebhook(rawBody, signature);

    if (result.success && result.event === "payment_success") {
      await handleStripePaymentSuccess(result.data);
    } else if (!result.success && result.event === "payment_failed") {
      await handlePaymentFailed("STRIPE", result.data);
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    sentryTracker(error, { source: "webhook.controller" });
    console.error("Error processing Stripe webhook:", error);
    res.status(500).send("Internal server error");
  }
};

// Generic webhook handler
export const genericWebhook = async (req: Request, res: Response) => {
  try {
    const provider = req.path.includes("paypal")
      ? "PAYPAL"
      : req.path.includes("stripe")
        ? "STRIPE"
        : (req.headers["x-payment-provider"] as string);

    if (!provider) {
      return res.status(400).send("Payment provider not specified");
    }

    const paymentService = PaymentFactory.createPaymentService(provider);

    let signature = "";
    let timestamp = "";
    let transmissionId = "";
    let certUrl = "";

    if (provider === "PAYPAL") {
      signature = req.headers["paypal-transmission-sig"] as string;
      transmissionId = req.headers["paypal-transmission-id"] as string;
      timestamp = req.headers["paypal-transmission-time"] as string;
      certUrl = req.headers["paypal-cert-url"] as string;
    } else if (provider === "STRIPE") {
      signature = req.headers["stripe-signature"] as string;
    }

    const rawBody = JSON.stringify(req.body);

    if (provider === "PAYPAL" && transmissionId && timestamp && certUrl) {
      const isValid = await paymentService.verifyWebhookSignature(
        rawBody,
        signature,
        timestamp,
        certUrl,
        transmissionId
      );

      if (!isValid) {
        return res.status(400).send("Invalid signature");
      }
    }

    const result = await paymentService.handleWebhook(rawBody, signature);

    if (result.success) {
      switch (result.event) {
        case "payment_captured":
        case "payment_success":
          await handlePaymentSuccess(provider, result.data);
          break;
        case "order_approved":
          if (provider === "PAYPAL") {
            await handlePayPalOrderApproved(result.data);
          }
          break;
        case "payment_failed":
          await handlePaymentFailed(provider, result.data);
          break;
      }
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    sentryTracker(error, { source: "webhook.controller" });
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal server error");
  }
};

async function handlePayPalOrderApproved(resource: any) {
  const paypalOrderId = resource.id;

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

async function handlePayPalPaymentCaptured(resource: any) {
  const captureId = resource.id;
  const paypalOrderId = resource.supplementary_data?.related_ids?.order_id;

  if (!paypalOrderId) return;

  const payment = await prisma.payment.findFirst({
    where: { providerReferenceId: paypalOrderId },
    include: {
      order: { include: { items: true } },
    },
  });

  if (!payment?.order?.items?.length) return;

  const order = payment.order;

  if (
    order.status === "PROCESSING" ||
    order.status === "SHIPPED" ||
    order.status === "DELIVERED"
  ) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerCaptureId: captureId,
        capturedAt: new Date(),
        attemptStatus: "COMPLETED",
      },
    });
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      attemptStatus: "COMPLETED",
      providerCaptureId: captureId,
      capturedAt: new Date(),
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PROCESSING",
      paymentStatus: "COMPLETED",
    },
  });

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

async function handleStripePaymentSuccess(session: any) {
  const sessionId = session.id;
  const metadata = session.metadata;

  let payment = sessionId
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

  const order = payment.order;

  if (
    order.status === "PROCESSING" ||
    order.status === "SHIPPED" ||
    order.status === "DELIVERED"
  ) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerCaptureId: sessionId,
        capturedAt: new Date(),
        attemptStatus: "COMPLETED",
      },
    });
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      attemptStatus: "COMPLETED",
      providerCaptureId: sessionId,
      capturedAt: new Date(),
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PROCESSING",
      paymentStatus: "COMPLETED",
    },
  });

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

async function handlePaymentSuccess(provider: string, data: any) {
  if (provider === "PAYPAL") {
    await handlePayPalPaymentCaptured(data);
  } else if (provider === "STRIPE") {
    await handleStripePaymentSuccess(data);
  }
}

async function handlePaymentFailed(provider: string, data: any) {
  let providerOrderId: string | undefined;
  let internalOrderId: string | undefined;

  if (provider === "PAYPAL") {
    providerOrderId = data.supplementary_data?.related_ids?.order_id;
  } else if (provider === "STRIPE") {
    providerOrderId = data.id;
    internalOrderId = data.metadata?.internalOrderId;
  }

  const order = await findOrderByIdentifiers(
    providerOrderId,
    internalOrderId,
    undefined,
    false
  );

  if (!order) return;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PAYMENT_FAILED",
      paymentStatus: "FAILED",
      updatedAt: new Date(),
    },
  });

  await prisma.payment.updateMany({
    where: {
      orderId: order.id,
      attemptStatus: { in: ["PENDING", "AUTHORIZED"] },
    },
    data: { attemptStatus: "FAILED" },
  });
}
