"use client";

import type { Order } from "@/types/order/orderTypes";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/types/formatCurrency";
import { isOrderTerminalFailure } from "@/components/storefront/orders/utils/orderFilters";
import { OrderStatusBadge } from "@/components/storefront/orders/atoms/OrderStatusBadge";
import { Package } from "lucide-react";

export default function OrderList({
  orders,
  selectedOrderId,
  onSelect,
}: {
  orders: Order[];
  selectedOrderId: string | null;
  onSelect: (orderId: string) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
        No orders in this tab yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const active = selectedOrderId === order.id;
        const terminalFailure = isOrderTerminalFailure(order.status);
        const firstItem = order.items?.[0];
        const moreCount = Math.max(0, (order.items?.length ?? 0) - 1);

        return (
          <article
            key={order.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(order.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(order.id);
              }
            }}
            className={cn(
              "cursor-pointer rounded-lg border bg-card transition-all",
              terminalFailure && "border-destructive/25 bg-destructive/[0.02]",
              active
                ? "border-primary/50 ring-1 ring-primary/20"
                : !terminalFailure &&
                    "border-border hover:border-primary/30 hover:bg-muted/20"
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {firstItem?.productCategory ?? "FutureShop"} Store
              </p>
              <OrderStatusBadge status={order.status} />
            </div>

            {firstItem && (
              <div className="flex gap-3 px-4 py-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-foreground">
                    {firstItem.productName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {firstItem.color ? `Color: ${firstItem.color}` : ""}
                    {firstItem.size ? ` • Size: ${firstItem.size}` : ""}
                  </p>
                  {moreCount > 0 && (
                    <p className="mt-1 text-xs text-primary">
                      +{moreCount} more item{moreCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="font-semibold text-foreground">
                    {formatCurrency(firstItem.price, order.currency ?? "USD")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {firstItem.quantity}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
              <span>#{order.id.slice(0, 12)}</span>
              <span>{formatDate(order.createdAt)}</span>
              <span className="font-medium text-foreground">
                {formatCurrency(order.total, order.currency ?? "USD")}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
