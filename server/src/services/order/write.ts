import type { OrderStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

/**
 * Maps each product id to its marketplace seller (for stamping `OrderItem.sellerId`).
 */
export async function resolveSellerIdsForProductIds(
  productIds: string[]
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (productIds.length === 0) {
    return map;
  }
  const rows = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, sellerId: true },
  });
  for (const row of rows) {
    map.set(row.id, row.sellerId ?? null);
  }
  return map;
}

export async function updateOrderStatusById(
  orderId: string,
  status: OrderStatus
) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

/** Orders in these states already had stock/coupon fulfillment applied. */
export const FULFILLED_ORDER_STATUSES: OrderStatus[] = ["PROCESSING", "SHIPPED", "DELIVERED"];

/**
 * Atomically marks an order paid (PROCESSING / COMPLETED).
 * Returns false when another request (webhook retry or return-page capture) already did,
 * so the caller must skip fulfillment — this prevents double stock decrements.
 */
export async function claimOrderForFulfillment(orderId: string): Promise<boolean> {
  const { count } = await prisma.order.updateMany({
    where: {
      id: orderId,
      status: { notIn: FULFILLED_ORDER_STATUSES },
      paymentStatus: { notIn: ["COMPLETED", "REFUNDED"] },
    },
    data: { status: "PROCESSING", paymentStatus: "COMPLETED" },
  });
  return count === 1;
}
