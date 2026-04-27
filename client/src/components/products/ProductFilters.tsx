"use client";

import { useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { brands, categories as defaultCategories, sizes } from "@/utils/config";
import { useCategoryStore } from "@/store/useCategoryStore";

const colors = [
  { name: "Navy", class: "bg-[#0F172A]" },
  { name: "Yellow", class: "bg-[#FCD34D]" },
  { name: "White", class: "bg-white border" },
  { name: "Orange", class: "bg-[#FB923C]" },
  { name: "Green", class: "bg-[#22C55E]" },
  { name: "Pink", class: "bg-[#EC4899]" },
  { name: "Cyan", class: "bg-[#06B6D4]" },
  { name: "Blue", class: "bg-[#3B82F6]" },
];

interface ProductFiltersProps {
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  selectedCategories: string[];
  selectedSizes: string[];
  selectedColors: string[];
  selectedBrands: string[];
  onToggleFilter: (
    filterType: "categories" | "sizes" | "brands" | "colors",
    value: string
  ) => void;
  /** Hide category checkboxes when department is chosen via URL / header dropdown */
  hideCategories?: boolean;
}

export function ProductFilters({
  priceRange,
  setPriceRange,
  selectedCategories,
  selectedSizes,
  selectedColors,
  selectedBrands,
  onToggleFilter,
  hideCategories = false,
}: ProductFiltersProps) {
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const flatCategoryOptions = useMemo(() => {
    if (categories.length === 0) return defaultCategories;

    return categories.flatMap((category) => [
      category.title,
      ...category.subcategories.map((subCategory) => subCategory.title),
    ]);
  }, [categories]);

  return (
    <div className="space-y-6">
      {!hideCategories && (
        <div>
          <h3 className="mb-3 font-semibold">Categories</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {flatCategoryOptions.map((category) => (
              <div key={category} className="flex items-center">
                <Checkbox
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => onToggleFilter("categories", category)}
                  id={`category-${category}`}
                />
                <Label htmlFor={`category-${category}`} className="ml-2 text-sm">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 font-semibold">Brands</h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center">
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => onToggleFilter("brands", brand)}
                id={`brand-${brand}`}
              />
              <Label htmlFor={`brand-${brand}`} className="ml-2 text-sm">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Size</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((sizeItem) => (
            <Button
              key={sizeItem}
              variant={selectedSizes.includes(sizeItem) ? "default" : "outline"}
              onClick={() => onToggleFilter("sizes", sizeItem)}
              className="h-8 w-8"
              size="sm"
            >
              {sizeItem}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Colors</h3>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color.name}
              className={`w-6 h-6 rounded-full ${color.class} ${
                selectedColors.includes(color.name)
                  ? "ring-offset-2 ring-black ring-2"
                  : ""
              }`}
              title={color.name}
              onClick={() => onToggleFilter("colors", color.name)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Price range</h3>
        <Slider
          defaultValue={[0, 100000]}
          max={100000}
          step={1}
          className="w-full"
          value={priceRange}
          onValueChange={setPriceRange}
        />
        <div className="flex justify-between mt-2 text-sm">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>
    </div>
  );
}
