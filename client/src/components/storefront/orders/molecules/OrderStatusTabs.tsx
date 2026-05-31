"use client";

import { cn } from "@/lib/utils";
import {
  ORDER_LIST_TABS,
  type OrderListTab,
} from "@/components/storefront/orders/utils/orderFilters";

export function OrderStatusTabs({
  activeTab,
  counts,
  onChange,
}: {
  activeTab: OrderListTab;
  counts: Record<OrderListTab, number>;
  onChange: (tab: OrderListTab) => void;
}) {
  return (
    <div className="border-b border-border">
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {ORDER_LIST_TABS.map((tab) => {
          const count = counts[tab.id];
          const label =
            tab.id === "to-review" && count > 0
              ? `${tab.label} (${count})`
              : tab.label;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              {activeTab === tab.id && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
