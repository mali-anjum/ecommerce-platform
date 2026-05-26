import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { getWishlistAvailability } from "./availability";
import {
  computeProductPricing,
  getEffectiveUnitPrice,
} from "./productPricing";

const productSelect = {
  id: true,
  name: true,
  brand: true,
  category: true,
  price: true,
  discountPercent: true,
  dealStartsAt: true,
  dealEndsAt: true,
  stock: true,
  images: true,
  isActive: true,
  isArchived: true,
  sizes: true,
  colors: true,
} satisfies Prisma.ProductSelect;

type WishlistItemWithProduct = Prisma.WishlistItemGetPayload<{
  include: { product: { select: typeof productSelect } };
}>;

export type WishlistItemDto = {
  id: string;
  productId: string;
  name: string;
  brand: string;
  category: string;
  thumbnail: string | null;
  price: number;
  salePrice: number | null;
  discountPercent: number | null;
  stock: number;
  availability: ReturnType<typeof getWishlistAvailability>;
  isPurchasable: boolean;
  sizes: string[];
  colors: string[];
  addedAt: string;
};

export type ToggleWishlistResult = {
  action: "added" | "removed";
  item: WishlistItemDto | null;
  productId: string;
};

function mapWishlistItem(row: WishlistItemWithProduct): WishlistItemDto {
  const product = row.product;
  const pricing = computeProductPricing(product);
  const availability = getWishlistAvailability(product);

  return {
    id: row.id,
    productId: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    thumbnail: product.images[0] ?? null,
    price: pricing.price,
    salePrice: pricing.salePrice,
    discountPercent: pricing.discountPercent,
    stock: product.stock,
    availability,
    isPurchasable: availability === "available",
    sizes: product.sizes,
    colors: product.colors,
    addedAt: row.createdAt.toISOString(),
  };
}

export class WishlistService {
  static async getOrCreateWishlist(userId: string) {
    const existing = await prisma.wishlist.findUnique({
      where: { userId },
    });
    if (existing) {
      return existing;
    }
    return prisma.wishlist.create({
      data: { userId },
    });
  }

  static async getUserWishlist(userId: string): Promise<{
    items: WishlistItemDto[];
    totalItems: number;
    totalValue: number;
  }> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const rows = await prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: { product: { select: productSelect } },
      orderBy: { createdAt: "desc" },
    });

    const items = rows.map(mapWishlistItem);
    const totalValue = items.reduce(
      (sum, item) =>
        sum +
        getEffectiveUnitPrice({
          price: item.price,
          salePrice: item.salePrice,
          discountPercent: item.discountPercent,
          hasActiveDeal: item.salePrice !== null,
        }),
      0
    );

    return {
      items,
      totalItems: items.length,
      totalValue: Math.round(totalValue * 100) / 100,
    };
  }

  static async toggleItem(
    userId: string,
    productId: string
  ): Promise<ToggleWishlistResult> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const wishlist = await this.getOrCreateWishlist(userId);

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
      include: { product: { select: productSelect } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return {
        action: "removed",
        item: null,
        productId,
      };
    }

    try {
      const created = await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
        include: { product: { select: productSelect } },
      });

      return {
        action: "added",
        item: mapWishlistItem(created),
        productId,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const row = await prisma.wishlistItem.findUnique({
          where: {
            wishlistId_productId: { wishlistId: wishlist.id, productId },
          },
          include: { product: { select: productSelect } },
        });
        if (row) {
          await prisma.wishlistItem.delete({ where: { id: row.id } });
          return { action: "removed", item: null, productId };
        }
      }
      throw error;
    }
  }

  static async removeItem(userId: string, wishlistItemId: string): Promise<void> {
    const deleted = await prisma.wishlistItem.deleteMany({
      where: {
        id: wishlistItemId,
        wishlist: { userId },
      },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Wishlist item not found");
    }
  }

  static async isProductInWishlist(
    userId: string,
    productId: string
  ): Promise<boolean> {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wishlist) {
      return false;
    }

    const item = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
      select: { id: true },
    });

    return Boolean(item);
  }
}
