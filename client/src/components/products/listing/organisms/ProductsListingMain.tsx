"use client";

import { ProductGrid } from "@/components/products/organisms/ProductGrid";
import { Pagination } from "@/components/products/molecules/ProductPagination";
import type { Product } from "@/types/product";
import { ProductsEmptyState } from "@/components/products/listing/molecules/ProductsEmptyState";
import { ProductsFetchErrorState } from "@/components/products/listing/molecules/ProductsFetchErrorState";
import { ProductsLoadMoreButton } from "@/components/products/listing/molecules/ProductsLoadMoreButton";
import { ProductsResultsSummary } from "@/components/products/listing/molecules/ProductsResultsSummary";

export type ProductsListingMainProps = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onClearFilters: () => void;
};

/** Main column: summary, grid, pagination, empty, and load-more states. */
export function ProductsListingMain({
  products,
  isLoading,
  error,
  totalProducts,
  currentPage,
  totalPages,
  onPageChange,
  onRetry,
  onClearFilters,
}: ProductsListingMainProps) {
  const showingProducts = products?.length ?? 0;

  return (
    <div>
      <ProductsResultsSummary
        isLoading={isLoading}
        totalProducts={totalProducts}
        currentPage={currentPage}
        totalPages={totalPages}
        showingProducts={showingProducts}
      />

      {error ? (
        <ProductsFetchErrorState error={error} onRetry={onRetry} />
      ) : (
        <>
          <ProductGrid products={products} isLoading={isLoading} error={error} />

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <ProductsEmptyState onClearFilters={onClearFilters} />
          )}
        </>
      )}

      {!isLoading && !error && totalProducts > products.length && (
        <ProductsLoadMoreButton onLoadMore={() => onPageChange(currentPage + 1)} />
      )}
    </div>
  );
}
