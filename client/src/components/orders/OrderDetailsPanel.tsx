"use client";

import type { Order } from "@/types/order/orderTypes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { formatCurrency, formatDate } from "@/types/formatCurrency";

export default function OrderDetailsPanel({
  order,
  isLoading,
}: {
  order: Order | null;
  isLoading: boolean;
}) {
  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select an order and click <span className="font-medium">Track now</span>{" "}
          to see the delivery timeline and full details.
        </CardContent>
      </Card>
    );
  }

  const primaryShipment =
    order.shipments?.find((shipment) => shipment.key === "DEFAULT") ??
    order.shipments?.[0] ??
    null;
  const timelineEvents =
    primaryShipment?.trackingEvents && primaryShipment.trackingEvents.length > 0
      ? primaryShipment.trackingEvents
      : order.trackingEvents;
  const hasShippingDetails =
    primaryShipment?.carrier ||
    primaryShipment?.trackingNumber ||
    primaryShipment?.estimatedDeliveryAt;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Order #{order.id}</CardTitle>
          <Badge>{order.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Placed</p>
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
        </CardContent>
      </Card>

      {hasShippingDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Carrier</p>
              <p className="font-medium">{primaryShipment?.carrier ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tracking number</p>
              <p className="font-medium">{primaryShipment?.trackingNumber ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estimated delivery</p>
              <p className="font-medium">
                {primaryShipment?.estimatedDeliveryAt
                  ? formatDate(primaryShipment.estimatedDeliveryAt)
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-5">
          <OrderTimeline status={order.status} events={timelineEvents} />
          {isLoading && (
            <p className="mt-3 text-sm text-muted-foreground">
              Updating tracking details…
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items in this order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="rounded-md border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm font-medium">
                  {formatCurrency(item.price, order.currency ?? "USD")}
                </p>
              </div>
              <Separator className="my-2" />
              <p className="text-sm text-muted-foreground">
                Qty: {item.quantity}
                {item.size ? ` • Size: ${item.size}` : ""}
                {item.color ? ` • Color: ${item.color}` : ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}