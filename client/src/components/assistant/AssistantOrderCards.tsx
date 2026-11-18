"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatEstimatedDeliveryDate,
  formatOrderStatus,
  formatTimelineDate,
} from "@/components/common/utils/formatDates";
import type { AssistantOrderSummary } from "@/lib/assistant/types";

type AssistantOrderCardsProps = {
  orders: AssistantOrderSummary[];
};

export function AssistantOrderCards({ orders }: AssistantOrderCardsProps) {
  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {orders.map((order) => {
        const eta = formatEstimatedDeliveryDate(order.estimatedDeliveryAt);
        const timeline = order.timeline.slice(0, 4);

        return (
          <div
            key={order.id}
            className="rounded-xl border border-border/70 bg-background/80 p-3"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Order {order.id.slice(0, 8)}…
              </span>
              <Badge variant="outline" className="text-[10px]">
                {formatOrderStatus(order.status)}
              </Badge>
              {order.canRequestCancel && (
                <Badge variant="secondary" className="text-[10px]">
                  Cancellable
                </Badge>
              )}
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: order.currency,
                }).format(order.total)}
              </p>
              {order.trackingNumber && (
                <p>
                  {order.carrier ? `${order.carrier}: ` : "Tracking: "}
                  {order.trackingNumber}
                </p>
              )}
              {eta && <p>Estimated delivery: {eta}</p>}
            </div>

            {timeline.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-2">
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        index === 0 ? "bg-primary" : "bg-muted-foreground/40",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {event.status
                          ? formatOrderStatus(event.status)
                          : "Update"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTimelineDate(event.occurredAt)}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs">
              <Link href={`/orders?orderId=${order.id}`}>View order details</Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
