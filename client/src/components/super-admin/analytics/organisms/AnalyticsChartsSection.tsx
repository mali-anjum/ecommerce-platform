"use client";

import {
  RevenueTrendChart,
  OrderStatusChart,
  CategoryRevenueChart,
  GeographicChart,
  FunnelPanel,
} from "../molecules/AnalyticsCharts";

interface AnalyticsChartsSectionProps {
  data: {
    revenueTrend: any[];
    orderStatusBreakdown: any[];
    topCategories: any[];
    geographicSales: any[];
    conversionFunnel: any[];
  };
}

export function AnalyticsChartsSection({ data }: AnalyticsChartsSectionProps) {
  return (
    <div className="space-y-6">
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
    </div>
  );
}