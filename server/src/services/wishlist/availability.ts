import type { Product } from "@prisma/client";

export type WishlistAvailability =
  | "available"
  | "out_of_stock"
  | "unavailable";

export function getWishlistAvailability(
  product: Pick<Product, "isActive" | "isArchived" | "stock"> | null
): WishlistAvailability {
  if (!product) {
    return "unavailable";
  }
  if (!product.isActive || product.isArchived) {
    return "unavailable";
  }
  if (product.stock <= 0) {
    return "out_of_stock";
  }
  return "available";
}
