"use client";

import {
  Grid3x3,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProductCollectionTabId } from "@/components/products/listing/utils/products-listing.utils";

type CollectionTabConfig = {
  id: ProductCollectionTabId;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const COLLECTION_TABS: CollectionTabConfig[] = [
  { id: "all", label: "All Products", icon: Grid3x3 },
  { id: "new", label: "New Arrivals", icon: Zap, badge: "HOT" },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "bestsellers", label: "Bestsellers", icon: Star },
  { id: "ai", label: "Featured", icon: Sparkles, badge: "★" },
];

export type ProductsCollectionTabsProps = {
  value: string;
  onChange: (id: string) => void;
  totalProducts: number;
};

/** Collection tabs — drives `/fetch-client-products?collection=`. */
export function ProductsCollectionTabs({
  value,
  onChange,
  totalProducts,
}: ProductsCollectionTabsProps) {
  return (
    <div className="mb-8">
      <Tabs value={value} onValueChange={onChange} className="w-full">
        <TabsList className="glass-effect flex w-full flex-nowrap overflow-x-auto border border-glass-border p-1">
          {COLLECTION_TABS.map((collection) => {
            const Icon = collection.icon;
            return (
              <TabsTrigger
                key={collection.id}
                value={collection.id}
                className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                {collection.label}
                {collection.id === "all" && (
                  <Badge variant="outline" className="ml-2 border-border">
                    {totalProducts}
                  </Badge>
                )}
                {collection.badge && (
                  <Badge className="ml-1 bg-accent text-xs text-accent-foreground">
                    {collection.badge}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
