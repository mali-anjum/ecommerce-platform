"use client";

import { KpiCard } from "@/components/super-admin/analytics/atoms/KpiCard";
import { formatCurrency, formatNumber } from "@/components/super-admin/analytics/utils/formatters";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";

interface KPIGridProps {
  data: {
    kpis: {
      totalRevenue: number;
      revenueChangePercent: number;
      totalOrders: number;
      ordersChangePercent: number;
      averageOrderValue: number;
      aovChangePercent: number;
      totalCustomers: number;
      newCustomers: number;
      newCustomersChangePercent: number;
    };
  };
}

export function KPIGrid({ data }: KPIGridProps) {
  return (
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
  );
}