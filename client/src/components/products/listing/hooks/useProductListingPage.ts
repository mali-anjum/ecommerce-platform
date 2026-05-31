"use client";

import { useProductStore } from "@/store/useProductStore";
import { useProductFilters } from "@/components/products/hooks/useProductFilter";
import { handleApiError } from "@/utils/errHandler";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toApiCollection } from "@/components/products/listing/utils/products-listing.utils";

/** Data fetching, URL sync, filters, and pagination for the products listing page. */
export function useProductListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mainCategoryQs = searchParams.get("mainCategory") ?? undefined;
  const subcategoryQs = searchParams.get("subcategory") ?? undefined;
  const urlSearchQs = searchParams.get("search") ?? "";

  const filters = useProductFilters();
  const {
    priceRange,
    setPriceRange,
    selectedCategories,
    selectedSizes,
    selectedColors,
    selectedBrands,
    selectedConditions,
    selectedSellerIds,
    onDeal,
    minDiscount,
    setOnDeal,
    setMinDiscount,
    handleToggleFilter,
    getFilters,
    syncFromQuery,
    resetFilters,
    clearSelectedCategories,
  } = filters;

  const {
    products,
    currentPage,
    totalPages,
    totalProducts,
    availableSellers,
    setCurrentPage,
    fetchProductsForClient,
    isLoading,
    error,
  } = useProductStore();

  const [searchQuery, setSearchQuery] = useState(urlSearchQs);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [collectionTab, setCollectionTab] = useState("all");

  useEffect(() => {
    setSearchQuery(urlSearchQs);
  }, [urlSearchQs]);

  useEffect(() => {
    syncFromQuery(new URLSearchParams(searchParams.toString()));
  }, [searchParams, syncFromQuery]);

  useEffect(() => {
    clearSelectedCategories();
  }, [mainCategoryQs, subcategoryQs, clearSelectedCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    collectionTab,
    debouncedSearch,
    mainCategoryQs,
    subcategoryQs,
    selectedConditions,
    selectedSellerIds,
    onDeal,
    minDiscount,
    setCurrentPage,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const setArray = (key: string, values: string[]) => {
      params.delete(key);
      if (values.length > 0) params.set(key, values.join(","));
    };

    setArray("conditions", selectedConditions);
    setArray("sellerIds", selectedSellerIds);

    if (onDeal) params.set("onDeal", "true");
    else params.delete("onDeal");

    if (minDiscount > 0) params.set("minDiscount", String(minDiscount));
    else params.delete("minDiscount");

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `/products?${next}` : "/products");
    }
  }, [
    minDiscount,
    onDeal,
    router,
    searchParams,
    selectedConditions,
    selectedSellerIds,
  ]);

  const fetchAllProducts = useCallback(() => {
    const filterPayload = getFilters();
    fetchProductsForClient({
      ...filterPayload,
      categories:
        mainCategoryQs || subcategoryQs ? undefined : filterPayload.categories,
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 12,
      mainCategory: mainCategoryQs,
      subcategory: subcategoryQs,
      collection: toApiCollection(collectionTab),
    });
  }, [
    currentPage,
    getFilters,
    fetchProductsForClient,
    debouncedSearch,
    mainCategoryQs,
    subcategoryQs,
    collectionTab,
  ]);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts, currentPage]);

  useEffect(() => {
    if (error) {
      console.error("Product fetch error:", handleApiError(error));
    }
  }, [error]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setCurrentPage]
  );

  const handleRetry = useCallback(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const handleClearFilters = useCallback(() => {
    resetFilters();
    setSearchQuery("");
    router.replace("/products");
  }, [resetFilters, router]);

  return {
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
    filters: {
      priceRange,
      setPriceRange,
      selectedCategories,
      selectedSizes,
      selectedColors,
      selectedBrands,
      selectedConditions,
      selectedSellerIds,
      onDeal,
      minDiscount,
      setOnDeal,
      setMinDiscount,
      onToggleFilter: handleToggleFilter,
    },
  };
}
