import { prisma } from "../../lib/prisma";

export async function findProductDetailById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      images: true,
      brand: true,
      category: true,
      gender: true,
      stock: true,
      condition: true,
      discountPercent: true,
      dealStartsAt: true,
      dealEndsAt: true,
      rating: true,
      soldCount: true,
      subcategoryId: true,
      sellerId: true,
      sizes: true,
      colors: true,
      createdAt: true,
      updatedAt: true,
      seller: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
}
