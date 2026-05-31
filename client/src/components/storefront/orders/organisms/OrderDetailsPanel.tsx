"use client";

import type { Order } from "@/types/order/orderTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderHorizontalStepper } from "@/components/storefront/orders/molecules/OrderHorizontalStepper";
import { OrderEventTimeline } from "@/components/storefront/orders/molecules/OrderEventTimeline";
import { OrderStatusBadge } from "@/components/storefront/orders/atoms/OrderStatusBadge";
import { formatCurrency, formatDate } from "@/types/formatCurrency";
import {
  getOrderDisplayStatus,
  isOrderTerminalFailure,
} from "@/components/storefront/orders/utils/orderFilters";
import { AlertCircle, Copy, Loader2, MapPin, Truck } from "lucide-react";
import { useToast } from "@/components/ui/hooks/use-toast";

export default function OrderDetailsPanel({
  order,
  isLoading,
}: {
  order: Order | null;
  isLoading: boolean;
}) {
  const { toast } = useToast();

  if (!order) {
    return (
      <Card className="min-h-[420px] border-dashed">
        <CardContent className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
          <p>Select an order from the list to view tracking and delivery details.</p>
        </CardContent>
      </Card>
    );
  }

  const primaryShipment =
    order.shipments?.find((s) => s.key === "DEFAULT") ?? order.shipments?.[0] ?? null;
  const timelineEvents =
    primaryShipment?.trackingEvents?.length
      ? primaryShipment.trackingEvents
      : order.trackingEvents;
  const isCompleted = order.status === "DELIVERED";
  const terminalFailure = isOrderTerminalFailure(order.status);
  const trackingNumber = primaryShipment?.trackingNumber;

  const copyTracking = async () => {
    if (!trackingNumber) return;
    try {
      await navigator.clipboard.writeText(trackingNumber);
      toast({ title: "Copied", description: "Tracking number copied." });
    } catch {
      toast({
        title: "Copy failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Order details
            </p>
            <CardTitle className="text-2xl">
              {isCompleted ? "Delivered" : getOrderDisplayStatus(order.status)}
            </CardTitle>
          </div>
          <OrderStatusBadge status={order.status} />
        </CardHeader>

        {terminalFailure && (
          <CardContent className="border-t border-destructive/20 bg-destructive/5 pt-4">
            <div className="flex gap-3 rounded-lg border border-destructive/25 bg-card/80 p-4 text-sm">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {getOrderDisplayStatus(order.status)}
                </p>
                <p className="text-muted-foreground">
                  {order.status === "CANCELLED"
                    ? "This order was cancelled and will not be shipped."
                    : "Payment could not be completed for this order. You can place a new order when ready."}
                </p>
              </div>
            </div>
          </CardContent>
        )}

        {(trackingNumber || primaryShipment?.carrier) && (
          <CardContent className="border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted/30 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                {primaryShipment?.carrier && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Delivery partner: </span>
                    <span className="font-medium">{primaryShipment.carrier}</span>
                  </p>
                )}
                {trackingNumber && (
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Tracking:</span>
                    <span className="font-mono font-medium">{trackingNumber}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={copyTracking}
                      aria-label="Copy tracking number"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        )}

        <CardContent className={trackingNumber ? "pt-0" : ""}>
          {!terminalFailure && <OrderHorizontalStepper status={order.status} />}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading latest tracking…
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracking history</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderEventTimeline
            events={timelineEvents}
            fallbackStatus={getOrderDisplayStatus(order.status)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Order number</p>
            <p className="font-mono font-medium">{order.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Placed on</p>
            <p className="font-medium">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment</p>
            <p className="font-medium">
              {order.paymentMethod} • {order.paymentStatus}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Order total</p>
            <p className="font-medium">
              {formatCurrency(order.total, order.currency ?? "USD")}
            </p>
          </div>
          {primaryShipment?.deliveredAt && (
            <div>
              <p className="text-muted-foreground">Delivered on</p>
              <p className="font-medium">
                {formatDate(primaryShipment.deliveredAt)}
              </p>
            </div>
          )}
          {primaryShipment?.estimatedDeliveryAt && (
            <div>
              <p className="text-muted-foreground">Estimated delivery</p>
              <p className="font-medium">
                {formatDate(primaryShipment.estimatedDeliveryAt)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {order.address && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <MapPin className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Shipping address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">{order.address.name}</p>
            <p className="mt-1 text-muted-foreground">{order.address.address}</p>
            <p className="text-muted-foreground">
              {order.address.city}, {order.address.country}{" "}
              {order.address.postalCode}
            </p>
            <p className="mt-2 text-muted-foreground">{order.address.phone}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items in this order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{item.productName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Qty: {item.quantity}
                  {item.size ? ` • Size: ${item.size}` : ""}
                  {item.color ? ` • ${item.color}` : ""}
                </p>
              </div>
              <p className="shrink-0 font-medium">
                {formatCurrency(item.price * item.quantity, order.currency ?? "USD")}
              </p>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-sm font-semibold">
            <span>Subtotal ({order.items?.length ?? 0} items)</span>
            <span>{formatCurrency(order.total, order.currency ?? "USD")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
