"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ProductCategory } from "@/components/products/types/category";
import { MobileSheetBackHeader } from "@/components/layout/site-header/atoms/MobileSheetBackHeader";

type MobileSheetCategoriesPanelProps = {
  categories: ProductCategory[];
  onBack: () => void;
  onCloseSheet: () => void;
};

/** Mobile sheet: browse categories and subcategories. */
export function MobileSheetCategoriesPanel({
  categories,
  onBack,
  onCloseSheet,
}: MobileSheetCategoriesPanelProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <MobileSheetBackHeader title="Categories" onBack={onBack} />

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.title} className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => {
                onCloseSheet();
                router.push(
                  `/products?mainCategory=${encodeURIComponent(category.title)}`
                );
              }}
            >
              <span className="font-medium">{category.title}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            <div className="space-y-1 pl-4">
              {category.subcategories.map((sub) => (
                <Button
                  key={sub.title}
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    onCloseSheet();
                    router.push(
                      `/products?mainCategory=${encodeURIComponent(category.title)}&subcategory=${encodeURIComponent(sub.title)}`
                    );
                  }}
                >
                  {sub.title}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
