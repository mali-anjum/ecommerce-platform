import { prisma } from "../../lib/prisma";
import { scheduleProductIndexSync } from "../ai/productIndex";
import { scheduleAiChatConversion } from "../ai/analytics/ConversationLogService";
import { scheduleSalesOfferConversion } from "../ai/sales";
import { scheduleAnalyticsEvent } from "../analytics/analyticsEventService";
import { AnalyticsEventType } from "@prisma/client";

/** Line-level data needed to decrement inventory after a completed purchase. */
export type FulfillmentLine = {
  productId: string | null;
  quantity: number;
  couponId?: string | null;
};

export type FulfillmentAnalyticsContext = {
  orderId?: string;
  total?: number;
  sessionId?: string;
  visitorId?: string;
};

export type PaymentFulfillmentMetadata = {
  cartItemIds?: string[];
  sessionId?: string;
  visitorId?: string;
};

function metadataString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" && field.trim().length > 0
    ? field.trim()
    : undefined;
}

export function buildFulfillmentAnalyticsContext(
  order: { id: string; total: number },
  paymentMetadata?: unknown,
): FulfillmentAnalyticsContext {
  return {
    orderId: order.id,
    total: order.total,
    sessionId: metadataString(paymentMetadata, "sessionId"),
    visitorId: metadataString(paymentMetadata, "visitorId"),
  };
}

export function parsePurchasedCartItemIds(
  paymentMetadata?: unknown,
): string[] | undefined {
  if (!paymentMetadata || typeof paymentMetadata !== "object") return undefined;
  const cartItemIds = (paymentMetadata as PaymentFulfillmentMetadata).cartItemIds;
  if (!Array.isArray(cartItemIds)) return undefined;
  const ids = cartItemIds.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
  return ids.length > 0 ? ids : undefined;
}

/**
 * Decrements product stock, bumps coupon usage per line, then clears the user's cart.
 */
export async function applyPurchaseFulfillment(
  userId: string,
  lines: FulfillmentLine[],
  purchasedCartItemIds?: string[],
  analyticsContext?: FulfillmentAnalyticsContext,
): Promise<void> {
  scheduleAiChatConversion(userId);
  scheduleSalesOfferConversion({
    userId,
    sessionId: analyticsContext?.sessionId,
    visitorId: analyticsContext?.visitorId,
  });
  scheduleAnalyticsEvent({
    type: AnalyticsEventType.ORDER_COMPLETE,
    userId,
    sessionId: analyticsContext?.sessionId,
    metadata: {
      orderId: analyticsContext?.orderId ?? null,
      total: analyticsContext?.total ?? null,
      visitorId: analyticsContext?.visitorId ?? null,
    },
  });

  for (const item of lines) {
    if (!item.productId) {
      continue;
    }
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.quantity },
        soldCount: { increment: item.quantity },
      },
    });
    scheduleProductIndexSync(item.productId);
    if (item.couponId) {
      await prisma.coupon.update({
        where: { id: item.couponId },
        data: {
          usageCount: { increment: 1 },
        },
      });
    }
  }

  try {
    if (purchasedCartItemIds && purchasedCartItemIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: {
          id: { in: purchasedCartItemIds },
          cart: { userId },
        },
      });
      return;
    }

    await prisma.cartItem.deleteMany({
      where: { cart: { userId } },
    });
    await prisma.cart.delete({ where: { userId } });
  } catch {
    // Cart may already be cleared or missing.
  }
}
