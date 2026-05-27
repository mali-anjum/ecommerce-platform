"use client";

import { GeographicChart } from "@/components/super-admin/analytics/AnalyticsCharts";
import { AnalyticsPageBase } from "@/components/super-admin/analytics/AnalyticsPageBase";
import { DataTablePanel } from "@/components/super-admin/analytics/AnalyticsCharts";
import { KpiCard } from "@/components/super-admin/analytics/KpiCard";
import { formatCurrency } from "@/components/super-admin/analytics/formatters";
import { Globe2, MapPin, Plane } from "lucide-react";

export default function AnalyticsGlobalPage() {
  return (
    <AnalyticsPageBase
      title="Global & Cross-Border"
      subtitle="Regional demand, international order share, and export-style reporting — cross-border commerce view inspired by Alibaba global selling."
      render={(data) => (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard
              title="Countries served"
              value={String(data.geographicSales.length)}
              icon={Globe2}
            />
            <KpiCard
              title="Top market share"
              value={
                data.geographicSales[0]
                  ? `${data.geographicSales[0].sharePercent}%`
                  : "—"
              }
              hint={
                data.geographicSales[0]
                  ? data.geographicSales[0].country
                  : "No regional data yet"
              }
              icon={MapPin}
              accent="secondary"
            />
            <KpiCard
              title="Cross-border GMV"
              value={formatCurrency(
                data.geographicSales.reduce((sum, row) => sum + row.revenue, 0),
              )}
              icon={Plane}
              accent="accent"
            />
          </div>

          <GeographicChart data={data.geographicSales} />

          <DataTablePanel
            title="Regional breakdown"
            description="Orders and revenue by destination country from shipping addresses."
            rows={data.geographicSales}
            columns={[
              { key: "country", label: "Country" },
              { key: "orders", label: "Orders" },
              {
                key: "revenue",
                label: "Revenue",
                render: (row) => formatCurrency(row.revenue),
              },
              {
                key: "sharePercent",
                label: "Share",
                render: (row) => `${row.sharePercent}%`,
              },
            ]}
          />
        </div>
      )}
    />
  );
}
