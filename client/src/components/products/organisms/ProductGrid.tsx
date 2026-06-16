"use client";

import { Product } from "@/components/products/types/product";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ProductTableSkeleton } from "@/components/products/atoms/ProductTableSkeleton";
import { WishlistHeartButton } from "@/components/storefront/wishlist/atoms/WishlistHeartButton";
import { buildWishlistSnapshot } from "@/components/storefront/wishlist/utils/wishlistSnapshot";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

export function ProductGrid({ products, isLoading, error }: ProductGridProps) {
  const router = useRouter();

  if (isLoading) {
    return (
     <ProductTableSkeleton />
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: {error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {products.map((productItem) => (
        <div
          onClick={() => router.push(`/products/${productItem.id}`)}
          key={productItem.id}
          className="group cursor-pointer"
        >
          <div className="relative aspect-3/4 mb-4 bg-gray-100 overflow-hidden">
            <img
              src={productItem.images[0]}
              alt={productItem.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute right-2 top-2 z-10">
              <WishlistHeartButton
                productId={productItem.id}
                snapshot={buildWishlistSnapshot(productItem)}
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button className="bg-white text-black hover:bg-gray-100">
                Quick View
              </Button>
            </div>
          </div>
          <h3 className="font-bold">{productItem.name}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="font-semibold">
              ${productItem.price.toFixed(2)}
            </span>
            <div className="flex gap-1">
              {productItem.colors.map((colorItem, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: colorItem }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}