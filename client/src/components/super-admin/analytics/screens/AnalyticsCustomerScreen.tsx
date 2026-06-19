"use client";

import {
  CustomerGrowthChart,
  FunnelPanel,
} from "@/components/super-admin/analytics/molecules/AnalyticsCharts";
import { AnalyticsPageBase } from "@/components/super-admin/analytics/organisms/AnalyticsPageBase";
import { KpiCard } from "@/components/super-admin/analytics/atoms/KpiCard";
import { formatNumber } from "@/components/super-admin/analytics/utils/formatters";
import { ShoppingCart, UserPlus, Users } from "lucide-react";

export default function AnalyticsCustomersPage() {
  return (
    <AnalyticsPageBase
      title="Customer Analytics"
      subtitle="Acquisition, retention signals, cart behavior, and checkout funnel — buyer intelligence for your marketplace."
      render={(data) => (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total buyers"
              value={formatNumber(data.kpis.totalCustomers)}
              icon={Users}
            />
            <KpiCard
              title="New registrations"
              value={formatNumber(data.kpis.newCustomers)}
              changePercent={data.kpis.newCustomersChangePercent}
              icon={UserPlus}
              accent="success"
            />
            <KpiCard
              title="Active carts"
              value={formatNumber(data.kpis.activeCarts)}
              icon={ShoppingCart}
              accent="secondary"
            />
            <KpiCard
              title="Conversion"
              value={`${data.kpis.conversionRate}%`}
              hint={`Abandonment ${data.kpis.cartAbandonmentRate}%`}
              icon={ShoppingCart}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <CustomerGrowthChart data={data.customerGrowth} />
            <FunnelPanel stages={data.conversionFunnel} />
          </div>
        </div>
      )}
    />
  );
}
