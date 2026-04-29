import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export function parseAdminProductPagination(
  pageRaw: unknown,
  limitRaw: unknown
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);
  const limit = Math.min(
    Math.max(1, parseInt(String(limitRaw ?? "50"), 10) || 50),
    200
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Seller-scoped or global admin product table (paginated).
 */
export async function fetchProductsForAdminPaginated(
  sellerScope: string | null,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;
  const listWhere: Prisma.ProductWhereInput =
    sellerScope !== null ? { sellerId: sellerScope } : {};

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: listWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        stock: true,
        category: true,
        sellerId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.product.count({ where: listWhere }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    items: products,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      skip,
    },
  };
}
