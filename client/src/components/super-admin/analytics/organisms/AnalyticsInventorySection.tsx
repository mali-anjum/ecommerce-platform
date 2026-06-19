"use client";

import { InventoryHealthPanel } from "../molecules/AnalyticsCharts";

interface AnalyticsInventorySectionProps {
  data: {
    inventoryHealth: any;
  };
}

export function AnalyticsInventorySection({ data }: AnalyticsInventorySectionProps) {
  return (
    <div className="space-y-6">
      <InventoryHealthPanel health={data.inventoryHealth} />
    </div>
  );
}