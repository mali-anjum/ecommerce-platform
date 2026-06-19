"use client";

import { AnalyticsPageBase } from "@/components/super-admin/analytics/organisms/AnalyticsPageBase";
import { AnalyticsKPISection } from "@/components/super-admin/analytics/organisms/AnalyticsKPISection";
import { AnalyticsChartsSection } from "@/components/super-admin/analytics/organisms/AnalyticsChartsSection";
import { AnalyticsAISection } from "@/components/super-admin/analytics/organisms/AnalyticsAISection";
import { AnalyticsInventorySection } from "@/components/super-admin/analytics/organisms/AnalyticsInventorySection";

export default function AnalyticsOverviewScreen() {
  return (
    <AnalyticsPageBase
      title="Analytics Overview"
      subtitle="Alibaba / AliExpress–style commerce intelligence for your store: revenue, orders, catalog health, and cross-border demand in one control center."
      render={(data) => (
        <div className="space-y-6">
          <AnalyticsKPISection data={data} />
          <AnalyticsChartsSection data={data} />
          <AnalyticsAISection data={data} />
          <AnalyticsInventorySection data={data} />
        </div>
      )}
    />
  );
}