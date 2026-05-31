"use client";

import { cn } from "@/lib/utils";
import type { OrderTrackingEvent } from "@/components/storefront/orders/types/orderTypes";

function formatTimelineDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderEventTimeline({
  events,
  fallbackStatus,
}: {
  events?: OrderTrackingEvent[];
  fallbackStatus?: string;
}) {
  const sorted = [...(events ?? [])].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {fallbackStatus
          ? `Status: ${fallbackStatus}. Tracking updates will appear here when available.`
          : "No tracking events yet."}
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((event, index) => {
        const isLatest = index === 0;
        return (
          <div key={event.id} className="flex gap-4">
            <div className="flex w-28 shrink-0 flex-col pt-0.5 text-xs text-muted-foreground">
              {formatTimelineDate(event.occurredAt)}
            </div>
            <div className="relative flex flex-col items-center pb-6">
              <div
                className={cn(
                  "z-10 flex h-5 w-5 items-center justify-center rounded-full border-2",
                  isLatest
                    ? "border-primary bg-primary"
                    : "border-border bg-card"
                )}
              >
                {isLatest && (
                  <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                )}
              </div>
              {index < sorted.length - 1 && (
                <div className="absolute top-5 bottom-0 w-px bg-border" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-6">
              <p
                className={cn(
                  "text-sm font-semibold",
                  isLatest ? "text-primary" : "text-foreground"
                )}
              >
                {event.status?.replace(/_/g, " ") ?? "Update"}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {event.message}
              </p>
              {event.location && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.location}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
