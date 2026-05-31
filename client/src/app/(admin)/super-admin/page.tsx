"use client";

import {
  CategoryRevenueChart,
  FunnelPanel,
  GeographicChart,
  InventoryHealthPanel,
  OrderStatusChart,
  RevenueTrendChart,
} from "@/components/super-admin/analytics/molecules/AnalyticsCharts";
import { AnalyticsPageBase } from "@/components/super-admin/analytics/organisms/AnalyticsPageBase";
import { KpiCard } from "@/components/super-admin/analytics/atoms/KpiCard";
import { formatCurrency, formatNumber } from "@/components/super-admin/analytics/utils/formatters";
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

export default function SuperAdminAnalyticsOverviewPage() {
  return (
    <AnalyticsPageBase
      title="Analytics Overview"
      subtitle="Alibaba / AliExpress–style commerce intelligence for your store: revenue, orders, catalog health, and cross-border demand in one control center."
      render={(data) => (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Gross merchandise value"
              value={formatCurrency(data.kpis.totalRevenue)}
              changePercent={data.kpis.revenueChangePercent}
              icon={DollarSign}
              accent="primary"
            />
            <KpiCard
              title="Completed orders"
              value={formatNumber(data.kpis.totalOrders)}
              changePercent={data.kpis.ordersChangePercent}
              icon={ShoppingCart}
              accent="secondary"
            />
            <KpiCard
              title="Average order value"
              value={formatCurrency(data.kpis.averageOrderValue)}
              changePercent={data.kpis.aovChangePercent}
              icon={TrendingUp}
              accent="accent"
            />
            <KpiCard
              title="Customers"
              value={formatNumber(data.kpis.totalCustomers)}
              hint={`${data.kpis.newCustomers} new this period`}
              changePercent={data.kpis.newCustomersChangePercent}
              icon={Users}
              accent="success"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Conversion rate"
              value={`${data.kpis.conversionRate}%`}
              hint="Paid orders vs active carts"
              icon={TrendingUp}
            />
            <KpiCard
              title="Cart abandonment"
              value={`${data.kpis.cartAbandonmentRate}%`}
              icon={ShoppingCart}
              accent="warning"
            />
            <KpiCard
              title="Active products"
              value={formatNumber(data.kpis.activeProducts)}
              hint={`${data.kpis.lowStockCount} low stock · ${data.kpis.outOfStockCount} OOS`}
              icon={Package}
            />
            <KpiCard
              title="Fulfillment rate"
              value={`${data.kpis.fulfillmentRate}%`}
              hint={`Refund rate ${data.kpis.refundRate}%`}
              icon={Package}
              accent="success"
            />
          </div>

          <RevenueTrendChart data={data.revenueTrend} />

          <div className="grid gap-6 xl:grid-cols-2">
            <OrderStatusChart data={data.orderStatusBreakdown} />
            <CategoryRevenueChart data={data.topCategories} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <GeographicChart data={data.geographicSales} />
            </div>
            <FunnelPanel stages={data.conversionFunnel} />
          </div>

          <InventoryHealthPanel health={data.inventoryHealth} />
        </div>
      )}
    />
  );
}
