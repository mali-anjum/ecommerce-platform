import type { Product } from "@prisma/client";
import type { AiProductIndexEntry } from "./types";

// TODO: Weired formula for calculating price
export function computeEffectivePrice(
  price: number,
  discountPercent: number | null,
): number {
  if (discountPercent != null && discountPercent > 0) {
    return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
  }
  return price;
}

export function buildSearchText(product: {
  name: string;
  brand: string;
  description: string;
  category: string;
}): string {
  return [product.name, product.brand, product.description, product.category]
    .join(" ")
    .toLowerCase();
}

export function mapProductToIndexEntry(product: Product): AiProductIndexEntry {
  const discountPercent = product.discountPercent ?? null;
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category: product.category,
    condition: product.condition,
    discountPercent,
    effectivePrice: computeEffectivePrice(product.price, discountPercent),
    images: product.images,
    soldCount: product.soldCount,
    rating: product.rating,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    isArchived: product.isArchived,
    createdAt: product.createdAt.toISOString(),
    searchText: buildSearchText(product),
  };
}

export function isSellableIndexEntry(entry: AiProductIndexEntry): boolean {
  return entry.isActive && !entry.isArchived && entry.stock > 0;
}
