"use client";

import { ProductFilters } from "@/components/products/molecules/ProductFilters";

type ProductsFiltersSidebarProps = {
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
  hideCategories?: boolean;
};

/** Sticky desktop sidebar wrapping `ProductFilters`. */
export function ProductsFiltersSidebar(props: ProductsFiltersSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 rounded-2xl border border-glass-border bg-card/70 p-4">
        <h3 className="mb-3 font-semibold">Filter Products</h3>
        <ProductFilters {...props} />
      </div>
    </aside>
  );
}
