import type { Product } from "@/components/products/types/product";

export type SmartSearchProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  discountPercent: number | null;
  effectivePrice: number;
  images: string[];
  category: string;
  stock: number;
  rating: number | null;
};

export type SmartSearchResult = {
  query: string;
  intentSummary: string;
  products: SmartSearchProduct[];
  total: number;
  usedAi: boolean;
  filtersApplied?: {
    maxPrice?: number;
    minPrice?: number;
    categories?: string[];
  };
};

export function smartSearchProductToListingProduct(
  product: SmartSearchProduct,
): Product {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    discountPercent: product.discountPercent,
    images: product.images,
    stock: product.stock,
    rating: product.rating,
    sizes: ["One Size"],
    colors: ["Default"],
  };
}
