"use client";

import { KpiCard } from "@/components/super-admin/analytics/atoms/KpiCard";
import { formatNumber } from "@/components/super-admin/analytics/utils/formatters";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";

interface StatsGridProps {
  data: {
    kpis: {
      conversionRate: number;
      cartAbandonmentRate: number;
      activeProducts: number;
      lowStockCount: number;
      outOfStockCount: number;
      fulfillmentRate: number;
      refundRate: number;
    };
  };
}

export function StatsGrid({ data }: StatsGridProps) {
  return (
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
  );
}