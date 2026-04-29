import { useState, useCallback } from "react";
import { ProductFilters } from "@/types/product";

export const useProductFilters = () => {
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);
  const [onDeal, setOnDeal] = useState(false);
  const [minDiscount, setMinDiscount] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleToggleFilter = useCallback((
    filterType: "categories" | "sizes" | "brands" | "colors" | "conditions" | "sellerIds",
    value: string
  ) => {
    const setterMap = {
      categories: setSelectedCategories,
      sizes: setSelectedSizes,
      colors: setSelectedColors,
      brands: setSelectedBrands,
      conditions: setSelectedConditions,
      sellerIds: setSelectedSellerIds,
    };

    setterMap[filterType]((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  }, []);

  const handleSortChange = useCallback((value: string) => {
    const [newSortBy, newSortOrder] = value.split("-");
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as "asc" | "desc");
  }, []);

  const getFilters = useCallback((): ProductFilters => ({
    categories: selectedCategories,
    sizes: selectedSizes,
    colors: selectedColors,
    brands: selectedBrands,
    conditions: selectedConditions,
    sellerIds: selectedSellerIds,
    onDeal,
    minDiscount: minDiscount > 0 ? minDiscount : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    sortBy,
    sortOrder,
  }), [
    selectedCategories,
    selectedSizes,
    selectedColors,
    selectedBrands,
    selectedConditions,
    selectedSellerIds,
    onDeal,
    minDiscount,
    priceRange,
    sortBy,
    sortOrder,
  ]);

  const syncFromQuery = useCallback((params: URLSearchParams) => {
    const parseArray = (key: string) => {
      const value = params.get(key);
      if (!value) return [] as string[];
      return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
    };

    setSelectedConditions(parseArray("conditions"));
    setSelectedSellerIds(parseArray("sellerIds"));
    setOnDeal(params.get("onDeal") === "true");

    const discount = Number(params.get("minDiscount") ?? "0");
    setMinDiscount(Number.isFinite(discount) && discount > 0 ? discount : 0);
  }, []);

  const resetFilters = useCallback(() => {
    setPriceRange([0, 100000]);
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedBrands([]);
    setSelectedConditions([]);
    setSelectedSellerIds([]);
    setOnDeal(false);
    setMinDiscount(0);
    setSortBy("createdAt");
    setSortOrder("desc");
  }, []);

  const clearSelectedCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  return {
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
    sortBy,
    sortOrder,
    handleToggleFilter,
    handleSortChange,
    getFilters,
    syncFromQuery,
    resetFilters,
    clearSelectedCategories,
  };
};