"use client";

import { useProductStore } from "@/components/products/state/useProductStore";
import { useProductFilters } from "@/components/products/hooks/useProductFilter";
import { handleApiError } from "@/components/products/listing/utils/handleApiError";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toApiCollection } from "@/components/products/listing/utils/products-listing.utils";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { isSmartSearchQuery } from "@/lib/smart-search/isSmartSearchQuery";
import {
  smartSearchProductToListingProduct,
  type SmartSearchResult,
} from "@/lib/smart-search/types";
import type { Product } from "@/components/products/types/product";

/** Data fetching, URL sync, filters, and pagination for the products listing page. */
export function useProductListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mainCategoryQs = searchParams.get("mainCategory") ?? undefined;
  const subcategoryQs = searchParams.get("subcategory") ?? undefined;
  const urlSearchQs = searchParams.get("search") ?? "";
  const smartSearchEnabled = isFeatureEnabled("ai.smartSearch");

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
  const [smartSearchResult, setSmartSearchResult] = useState<SmartSearchResult | null>(
    null,
  );
  const [smartProducts, setSmartProducts] = useState<Product[]>([]);
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);
  const [smartSearchError, setSmartSearchError] = useState<string | null>(null);

  const useSmartSearchMode =
    smartSearchEnabled &&
    debouncedSearch.length > 0 &&
    (searchParams.get("smart") === "1" || isSmartSearchQuery(debouncedSearch));

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

  const fetchSmartSearch = useCallback(async () => {
    if (!debouncedSearch.trim()) {
      setSmartProducts([]);
      setSmartSearchResult(null);
      return;
    }

    setSmartSearchLoading(true);
    setSmartSearchError(null);

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: debouncedSearch, limit: 24 }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: SmartSearchResult;
        message?: string;
      };

      if (!res.ok || !json.data) {
        throw new Error(json.message ?? "Smart search failed");
      }

      setSmartSearchResult(json.data);
      setSmartProducts(
        json.data.products.map(smartSearchProductToListingProduct),
      );
    } catch (err) {
      setSmartSearchError(
        err instanceof Error ? err.message : "Smart search failed",
      );
      setSmartProducts([]);
      setSmartSearchResult(null);
    } finally {
      setSmartSearchLoading(false);
    }
  }, [debouncedSearch]);

  const fetchAllProducts = useCallback(() => {
    if (useSmartSearchMode) return;

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
    useSmartSearchMode,
  ]);

  useEffect(() => {
    if (useSmartSearchMode) {
      void fetchSmartSearch();
      return;
    }
    setSmartSearchResult(null);
    setSmartProducts([]);
    fetchAllProducts();
  }, [fetchAllProducts, fetchSmartSearch, useSmartSearchMode, currentPage]);

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
    if (useSmartSearchMode) {
      void fetchSmartSearch();
      return;
    }
    fetchAllProducts();
  }, [fetchAllProducts, fetchSmartSearch, useSmartSearchMode]);

  const handleClearFilters = useCallback(() => {
    resetFilters();
    setSearchQuery("");
    setSmartSearchResult(null);
    setSmartProducts([]);
    router.replace("/products");
  }, [resetFilters, router]);

  const displayProducts = useSmartSearchMode ? smartProducts : products;
  const displayLoading = useSmartSearchMode ? smartSearchLoading : isLoading;
  const displayError = useSmartSearchMode ? smartSearchError : error;
  const displayTotal = useSmartSearchMode
    ? smartSearchResult?.total ?? smartProducts.length
    : totalProducts;
  const displayTotalPages = useSmartSearchMode ? 1 : totalPages;

  return {
    mainCategoryQs,
    subcategoryQs,
    urlSearchQs,
    useSmartSearchMode,
    smartSearchResult,
    collectionTab,
    setCollectionTab,
    products: displayProducts,
    currentPage,
    totalPages: displayTotalPages,
    totalProducts: displayTotal,
    availableSellers,
    isLoading: displayLoading,
    error: displayError,
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
