"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SHIPPING_PROGRESS_LABELS,
  getShippingStepIndex,
} from "@/components/orders/orderFilters";
import type { Order } from "@/types/order/orderTypes";

export function OrderHorizontalStepper({ status }: { status: Order["status"] }) {
  const activeIndex = getShippingStepIndex(status);

  return (
    <div className="flex items-center justify-between gap-2 py-4">
      {SHIPPING_PROGRESS_LABELS.map((label, index) => {
        const done = index <= activeIndex;
        const current = index === activeIndex;

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              {index > 0 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 border-t border-dashed",
                    index <= activeIndex ? "border-primary/60" : "border-border"
                  )}
                />
              )}
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              {index < SHIPPING_PROGRESS_LABELS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 border-t border-dashed",
                    index < activeIndex ? "border-primary/60" : "border-border"
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "text-center text-xs font-medium",
                current || done ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
