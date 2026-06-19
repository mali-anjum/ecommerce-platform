"use client";

import {
  CategoryRevenueChart,
  DataTablePanel,
  InventoryHealthPanel,
} from "@/components/super-admin/analytics/molecules/AnalyticsCharts";
import { AnalyticsPageBase } from "@/components/super-admin/analytics/organisms/AnalyticsPageBase";
import { KpiCard } from "@/components/super-admin/analytics/atoms/KpiCard";
import {
  formatCurrency,
  formatNumber,
} from "@/components/super-admin/analytics/utils/formatters";
import { Heart, Package, Warehouse } from "lucide-react";

export default function AnalyticsProductsScreen() {
  return (
    <AnalyticsPageBase
      title="Product Analytics"
      subtitle="Top SKUs, category mix, inventory risk, and wishlist demand — seller catalog insights like AliExpress product performance."
      render={(data) => (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Catalog size"
              value={formatNumber(data.kpis.totalProducts)}
              hint={`${data.kpis.activeProducts} active`}
              icon={Package}
            />
            <KpiCard
              title="Low stock SKUs"
              value={formatNumber(data.kpis.lowStockCount)}
              icon={Warehouse}
              accent="warning"
            />
            <KpiCard
              title="Out of stock"
              value={formatNumber(data.kpis.outOfStockCount)}
              icon={Warehouse}
              accent="accent"
            />
            <KpiCard
              title="Wishlist saves"
              value={formatNumber(data.kpis.wishlistItems)}
              icon={Heart}
              accent="secondary"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <CategoryRevenueChart data={data.topCategories} />
            <InventoryHealthPanel health={data.inventoryHealth} />
          </div>

          <DataTablePanel
            title="Top products by revenue"
            description="Best performers in the selected period."
            rows={data.topProducts}
            columns={[
              { key: "name", label: "Product" },
              { key: "category", label: "Category" },
              {
                key: "revenue",
                label: "Revenue",
                render: (row) => formatCurrency(row.revenue),
              },
              { key: "unitsSold", label: "Units" },
              { key: "stock", label: "Stock" },
            ]}
          />

          <DataTablePanel
            title="Seller marketplace performance"
            description="Multi-seller revenue split (marketplace / cross-store view)."
            rows={data.sellerPerformance}
            columns={[
              { key: "name", label: "Seller" },
              {
                key: "revenue",
                label: "Revenue",
                render: (row) => formatCurrency(row.revenue),
              },
              { key: "unitsSold", label: "Units sold" },
              { key: "productCount", label: "Listings" },
            ]}
          />
        </div>
      )}
    />
  );
}
