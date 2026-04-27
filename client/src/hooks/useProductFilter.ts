import { useState, useCallback } from "react";
import { ProductFilters } from "@/types/product";

export const useProductFilters = () => {
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleToggleFilter = useCallback((
    filterType: "categories" | "sizes" | "brands" | "colors",
    value: string
  ) => {
    const setterMap = {
      categories: setSelectedCategories,
      sizes: setSelectedSizes,
      colors: setSelectedColors,
      brands: setSelectedBrands,
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
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    sortBy,
    sortOrder,
  }), [selectedCategories, selectedSizes, selectedColors, selectedBrands, priceRange, sortBy, sortOrder]);

  const resetFilters = useCallback(() => {
    setPriceRange([0, 100000]);
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedBrands([]);
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
    sortBy,
    sortOrder,
    handleToggleFilter,
    handleSortChange,
    getFilters,
    resetFilters,
    clearSelectedCategories,
  };
};