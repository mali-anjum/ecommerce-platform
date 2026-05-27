"use client";

import {
  HourlyOrdersChart,
  PaymentMethodChart,
  RevenueTrendChart,
} from "@/components/super-admin/analytics/AnalyticsCharts";
import { AnalyticsPageBase } from "@/components/super-admin/analytics/AnalyticsPageBase";
import { DataTablePanel } from "@/components/super-admin/analytics/AnalyticsCharts";
import { KpiCard } from "@/components/super-admin/analytics/KpiCard";
import {
  formatCurrency,
  formatStatusLabel,
} from "@/components/super-admin/analytics/formatters";
import { DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

export default function AnalyticsSalesPage() {
  return (
    <AnalyticsPageBase
      title="Sales & Revenue"
      subtitle="GMV trends, payment mix, peak hours, and order pipeline — comparable to Alibaba seller center sales reports."
      render={(data) => (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard
              title="GMV"
              value={formatCurrency(data.kpis.totalRevenue)}
              changePercent={data.kpis.revenueChangePercent}
              icon={DollarSign}
            />
            <KpiCard
              title="Orders"
              value={String(data.kpis.totalOrders)}
              changePercent={data.kpis.ordersChangePercent}
              icon={ShoppingCart}
            />
            <KpiCard
              title="AOV"
              value={formatCurrency(data.kpis.averageOrderValue)}
              changePercent={data.kpis.aovChangePercent}
              icon={TrendingUp}
            />
          </div>

          <RevenueTrendChart data={data.revenueTrend} />

          <div className="grid gap-6 xl:grid-cols-2">
            <PaymentMethodChart data={data.paymentMethodBreakdown} />
            <HourlyOrdersChart data={data.hourlyOrderDistribution} />
          </div>

          <DataTablePanel
            title="Order status breakdown"
            description="Volume and value by fulfillment stage."
            rows={data.orderStatusBreakdown}
            columns={[
              {
                key: "status",
                label: "Status",
                render: (row) => formatStatusLabel(row.status),
              },
              { key: "count", label: "Orders" },
              {
                key: "revenue",
                label: "Revenue",
                render: (row) => formatCurrency(row.revenue),
              },
            ]}
          />
        </div>
      )}
    />
  );
}
