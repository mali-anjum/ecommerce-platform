import type { Product } from "@/types/product";
import type {
  WishlistAvailability,
  WishlistProductSnapshot,
} from "@/types/wishlist/wishlistTypes";
import { computeProductPricing } from "@/components/products/productPricing";

export function getProductAvailability(product: Product): WishlistAvailability {
  if (!product) {
    return "unavailable";
  }
  if (product.stock <= 0) {
    return "out_of_stock";
  }
  return "available";
}

export function buildWishlistSnapshot(product: Product): WishlistProductSnapshot {
  const pricing = computeProductPricing({
    price: product.price,
    discountPercent: product.discountPercent,
    dealStartsAt: product.dealStartsAt,
    dealEndsAt: product.dealEndsAt,
  });

  const availability = getProductAvailability(product);

  return {
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
    sizes: product.sizes,
    colors: product.colors,
  };
}
