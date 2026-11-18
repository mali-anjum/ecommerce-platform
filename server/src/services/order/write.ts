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
