"use client";

import {
  DataTablePanel,
  OrderStatusChart,
} from "@/components/super-admin/analytics/molecules/AnalyticsCharts";
import { AnalyticsPageBase } from "@/components/super-admin/analytics/organisms/AnalyticsPageBase";
import { KpiCard } from "@/components/super-admin/analytics/atoms/KpiCard";
import {
  formatCurrency,
  formatStatusLabel,
} from "@/components/super-admin/analytics/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PackageCheck, RefreshCw, Truck } from "lucide-react";

export default function AnalyticsOperationsPage() {
  return (
    <AnalyticsPageBase
      title="Operations"
      subtitle="Fulfillment pipeline, recent transactions, and delivery performance — operations desk for order management."
      render={(data) => (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard
              title="Fulfillment rate"
              value={`${data.kpis.fulfillmentRate}%`}
              icon={PackageCheck}
              accent="success"
            />
            <KpiCard
              title="Refund rate"
              value={`${data.kpis.refundRate}%`}
              icon={RefreshCw}
              accent="warning"
            />
            <KpiCard
              title="Open pipeline"
              value={String(
                data.orderStatusBreakdown
                  .filter((s) => !["DELIVERED", "CANCELLED"].includes(s.status))
                  .reduce((sum, s) => sum + s.count, 0),
              )}
              icon={Truck}
            />
          </div>

          <OrderStatusChart data={data.orderStatusBreakdown} />

          <DataTablePanel
            title="Recent orders"
            description="Latest activity across the storefront."
            rows={data.recentOrders}
            columns={[
              {
                key: "id",
                label: "Order",
                render: (row) => row.id.slice(0, 8),
              },
              {
                key: "customerEmail",
                label: "Customer",
                render: (row) => row.customerName ?? row.customerEmail,
              },
              {
                key: "total",
                label: "Total",
                render: (row) => formatCurrency(row.total),
              },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <Badge variant="outline">{formatStatusLabel(row.status)}</Badge>
                ),
              },
              {
                key: "paymentMethod",
                label: "Payment",
                render: (row) => row.paymentMethod.replace("_", " "),
              },
              {
                key: "createdAt",
                label: "Date",
                render: (row) => format(new Date(row.createdAt), "MMM d, HH:mm"),
              },
            ]}
          />
        </div>
      )}
    />
  );
}
