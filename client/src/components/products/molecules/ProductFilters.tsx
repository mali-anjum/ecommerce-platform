"use client";

import { useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { brands, categories as defaultCategories, sizes } from "@/components/products/config/catalogDefaults";
import { useCategoryStore } from "@/components/products/state/useCategoryStore";

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
  selectedConditions: string[];
  selectedSellerIds: string[];
  onDeal: boolean;
  minDiscount: number;
  sellerOptions: Array<{ id: string; name: string }>;
  setOnDeal: (value: boolean) => void;
  setMinDiscount: (value: number) => void;
  onToggleFilter: (
    filterType:
      | "categories"
      | "sizes"
      | "brands"
      | "colors"
      | "conditions"
      | "sellerIds",
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
  selectedConditions,
  selectedSellerIds,
  onDeal,
  minDiscount,
  sellerOptions,
  setOnDeal,
  setMinDiscount,
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
        <h3 className="mb-3 font-semibold">Condition</h3>
        <div className="space-y-2">
          {["NEW", "REFURBISHED", "USED"].map((condition) => (
            <div key={condition} className="flex items-center">
              <Checkbox
                checked={selectedConditions.includes(condition)}
                onCheckedChange={() => onToggleFilter("conditions", condition)}
                id={`condition-${condition}`}
              />
              <Label htmlFor={`condition-${condition}`} className="ml-2 text-sm">
                {condition}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Seller</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {sellerOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No seller data available yet.</p>
          ) : (
            sellerOptions.map((seller) => (
              <div key={seller.id} className="flex items-center">
                <Checkbox
                  checked={selectedSellerIds.includes(seller.id)}
                  onCheckedChange={() => onToggleFilter("sellerIds", seller.id)}
                  id={`seller-${seller.id}`}
                />
                <Label htmlFor={`seller-${seller.id}`} className="ml-2 text-sm">
                  {seller.name}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Deals & Discounts</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <Checkbox
              checked={onDeal}
              onCheckedChange={(checked) => setOnDeal(checked === true)}
              id="onDeal"
            />
            <Label htmlFor="onDeal" className="ml-2 text-sm">
              On deal only
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {[0, 10, 20, 30, 40, 50].map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={minDiscount === value ? "default" : "outline"}
                onClick={() => setMinDiscount(value)}
                className="h-8"
              >
                {value === 0 ? "Any discount" : `${value}%+`}
              </Button>
            ))}
          </div>
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
