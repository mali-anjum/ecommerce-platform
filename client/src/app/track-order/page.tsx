"use client";

import { FormEvent, useMemo, useState } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_STEPS = [
  "DRAFT",
  "PENDING_PAYMENT",
  "PAYMENT_APPROVED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

const TERMINAL_STATUS: Record<string, string> = {
  CANCELLED: "This order was cancelled.",
  PAYMENT_FAILED: "Payment failed for this order.",
  CAPTURE_FAILED: "Payment capture failed for this order.",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

const formatDate = (value: string | undefined) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

export default function TrackOrderPage() {
  const { currentOrder, isLoading, error, getOrderForUser } = useOrderStore();
  const [orderId, setOrderId] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const activeStep = useMemo(() => {
    if (!currentOrder?.status) return -1;
    return STATUS_STEPS.indexOf(currentOrder.status as (typeof STATUS_STEPS)[number]);
  }, [currentOrder?.status]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedOrderId = orderId.trim();
    if (!normalizedOrderId) {
      setLocalError("Please enter a valid order ID.");
      return;
    }
    setLocalError(null);
    await getOrderForUser(normalizedOrderId);
  };

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Track your order</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your order ID to track shipment status for your account order.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Order lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID (e.g. 9b7e...)"
              required
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Tracking..." : "Track order"}
            </Button>
          </form>
          {(localError || error) && (
            <p className="mt-3 text-sm text-destructive">{localError || error}</p>
          )}
        </CardContent>
      </Card>

      {currentOrder && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Order #{currentOrder.id}</CardTitle>
              <Badge>{currentOrder.status}</Badge>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Placed</p>
                <p className="font-medium">{formatDate(currentOrder.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment</p>
                <p className="font-medium">
                  {currentOrder.paymentMethod} - {currentOrder.paymentStatus}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Order total</p>
                <p className="font-medium">{formatCurrency(currentOrder.total)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracking timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STATUS_STEPS.map((step, index) => {
                const reached = activeStep >= index;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        reached ? "bg-primary" : "bg-muted"
                      }`}
                    />
                    <p className={reached ? "font-medium text-foreground" : "text-muted-foreground"}>
                      {step}
                    </p>
                  </div>
                );
              })}
              {TERMINAL_STATUS[currentOrder.status] && (
                <p className="pt-2 text-sm text-destructive">
                  {TERMINAL_STATUS[currentOrder.status]}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items in this order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentOrder.items.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-3">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} | Price: {formatCurrency(item.price)}
                    {item.size ? ` | Size: ${item.size}` : ""}
                    {item.color ? ` | Color: ${item.color}` : ""}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
