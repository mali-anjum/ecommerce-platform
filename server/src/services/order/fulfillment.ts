import { prisma } from "../../lib/prisma";

/** Line-level data needed to decrement inventory after a completed purchase. */
export type FulfillmentLine = {
  productId: string | null;
  quantity: number;
  couponId?: string | null;
};

/**
 * Decrements product stock, bumps coupon usage per line, then clears the user's cart.
 */
export async function applyPurchaseFulfillment(
  userId: string,
  lines: FulfillmentLine[],
  purchasedCartItemIds?: string[]
): Promise<void> {
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
