"use client";

import { DataTablePanel } from "@/components/super-admin/analytics/molecules/AnalyticsCharts";
import { AnalyticsPageBase } from "@/components/super-admin/analytics/organisms/AnalyticsPageBase";
import { KpiCard } from "@/components/super-admin/analytics/atoms/KpiCard";
import { formatNumber } from "@/components/super-admin/analytics/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Gift, Heart, Tag } from "lucide-react";

export default function AnalyticsMarketingScreen() {
  return (
    <AnalyticsPageBase
      title="Marketing & Promotions"
      subtitle="Coupon utilization, promotional inventory, and wishlist engagement — campaign analytics similar to marketplace promotion centers."
      render={(data) => (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard
              title="Active coupons"
              value={formatNumber(data.kpis.activeCoupons)}
              icon={Tag}
            />
            <KpiCard
              title="Wishlist items"
              value={formatNumber(data.kpis.wishlistItems)}
              icon={Heart}
              accent="accent"
            />
            <KpiCard
              title="Refund rate"
              value={`${data.kpis.refundRate}%`}
              icon={Gift}
              accent="warning"
            />
          </div>

          <DataTablePanel
            title="Coupon performance"
            description="Usage against limits for active and historical codes."
            rows={data.couponPerformance}
            columns={[
              { key: "code", label: "Code" },
              {
                key: "isActive",
                label: "Status",
                render: (row) => (
                  <Badge variant={row.isActive ? "default" : "secondary"}>
                    {row.isActive ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              { key: "discountPercent", label: "Discount %" },
              { key: "usageCount", label: "Used" },
              { key: "usageLimit", label: "Limit" },
            ]}
          />
        </div>
      )}
    />
  );
}
