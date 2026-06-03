import { prisma } from "../../lib/prisma";
import { scheduleProductIndexSync } from "../ai/productIndex";
import { scheduleAiChatConversion } from "../ai/analytics/ConversationLogService";
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
};

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
  scheduleAnalyticsEvent({
    type: AnalyticsEventType.ORDER_COMPLETE,
    userId,
    sessionId: analyticsContext?.sessionId,
    metadata: {
      orderId: analyticsContext?.orderId ?? null,
      total: analyticsContext?.total ?? null,
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
