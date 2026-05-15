"use client";

import type { Order } from "@/types/order/orderTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/types/formatCurrency";

export default function OrderList({
  orders,
  selectedOrderId,
  onSelect,
  onTrackNow,
}: {
  orders: Order[];
  selectedOrderId: string | null;
  onSelect: (orderId: string) => void;
  onTrackNow: (orderId: string) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        You have not placed any orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const active = selectedOrderId === order.id;
        return (
          <Button
            key={order.id}
            type="button"
            onClick={() => onSelect(order.id)}
            className={`w-full rounded-xl border p-4 text-left transition-colors ${
              active
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card hover:bg-muted/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Order #{order.id.slice(0, 8)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Placed: {formatDate(order.createdAt)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total: {formatCurrency(order.total, order.currency ?? "USD")}
                </p>
              </div>
              <Badge variant={active ? "default" : "secondary"}>{order.status}</Badge>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Items: {order.items?.length ?? 0} • Payment: {order.paymentStatus}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTrackNow(order.id);
                }}
              >
                Track now
              </Button>
            </div>
          </Button>
        );
      })}
    </div>
  );
}

