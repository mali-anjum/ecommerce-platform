"use client";

import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types/order/orderTypes";
import {
  getOrderProgressIndex,
  ORDER_STATUS_STEPS,
  ORDER_TERMINAL_STATUS,
} from "@/types/order/orderTracking";
import { formatDate } from "@/types/formatCurrency";

export default function OrderTimeline({
  status,
  events,
}: {
  status: Order["status"];
  events?: Order["trackingEvents"];
}) {
  const activeStep = getOrderProgressIndex(status);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Tracking timeline</p>
        <Badge variant="secondary">{status}</Badge>
      </div>

      <div className="space-y-2">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const reached = activeStep >= index;
          return (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  reached ? "bg-primary" : "bg-muted"
                }`}
              />
              <p
                className={
                  reached
                    ? "text-sm font-medium text-foreground"
                    : "text-sm text-muted-foreground"
                }
              >
                {step}
              </p>
            </div>
          );
        })}
      </div>

      {ORDER_TERMINAL_STATUS[status] && (
        <p className="pt-1 text-sm text-destructive">
          {ORDER_TERMINAL_STATUS[status]}
        </p>
      )}

      {Array.isArray(events) && events.length > 0 && (
        <div className="pt-2">
          <p className="text-sm font-medium">Latest updates</p>
          <div className="mt-2 space-y-2">
            {[...events]
              .slice()
              .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
              .slice(0, 6)
              .map((event) => (
                <div key={event.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{event.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.occurredAt)}
                    </p>
                  </div>
                  {(event.location || event.status) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.location ? event.location : ""}
                      {event.location && event.status ? " • " : ""}
                      {event.status ? event.status : ""}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

