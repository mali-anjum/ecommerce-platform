"use client";

import { ProductsActiveFiltersBanner } from "@/components/products/listing/molecules/ProductsActiveFiltersBanner";
import { ProductsBackToTopFab } from "@/components/products/listing/atoms/ProductsBackToTopFab";
import { ProductsCollectionTabs } from "@/components/products/listing/molecules/ProductsCollectionTabs";
import { ProductsFiltersSidebar } from "@/components/products/listing/molecules/ProductsFiltersSidebar";
import { ProductsHeroBanner } from "@/components/products/listing/organisms/ProductsHeroBanner";
import { ProductsListingMain } from "@/components/products/listing/organisms/ProductsListingMain";
import { useProductListingPage } from "@/components/products/listing/hooks/useProductListingPage";

function ProductListingPage() {
  const {
    mainCategoryQs,
    subcategoryQs,
    urlSearchQs,
    collectionTab,
    setCollectionTab,
    products,
    currentPage,
    totalPages,
    totalProducts,
    availableSellers,
    isLoading,
    error,
    handlePageChange,
    handleRetry,
    handleClearFilters,
    filters,
  } = useProductListingPage();

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-card/20">
      <ProductsHeroBanner />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <ProductsActiveFiltersBanner
          mainCategory={mainCategoryQs}
          subcategory={subcategoryQs}
          search={urlSearchQs}
        />

        <ProductsCollectionTabs
          value={collectionTab}
          onChange={setCollectionTab}
          totalProducts={totalProducts}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <ProductsFiltersSidebar
            {...filters}
            sellerOptions={availableSellers}
            hideCategories={Boolean(mainCategoryQs || subcategoryQs)}
          />

          <ProductsListingMain
            products={products}
            isLoading={isLoading}
            error={error}
            totalProducts={totalProducts}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onRetry={handleRetry}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>

      <ProductsBackToTopFab />
    </div>
  );
}

export default ProductListingPage;
