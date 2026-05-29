"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrderStore } from "@/store/useOrderStore";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

function CheckoutSuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId")?.trim() ?? "";
  const { currentOrder, isLoading, error, getOrderForUser } = useOrderStore();

  useEffect(() => {
    if (!orderId) return;
    void getOrderForUser(orderId);
  }, [orderId, getOrderForUser]);

  if (!orderId) {
    return (
      <main className="container mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">No order reference in this link.</p>
        <Button asChild className="mt-6">
          <Link href="/checkout">Return to checkout</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Order confirmed</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you. Your payment was received and your order is being processed.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading order" />
        </div>
      )}

      {error && !isLoading && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {currentOrder && currentOrder.id === orderId && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs break-all">{currentOrder.id}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatCurrency(currentOrder.total)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Payment</span>
              <span>{currentOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Status</span>
              <span>{currentOrder.status}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button asChild variant="default">
          <Link href="/home">Continue shopping</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/track-order`}>Track order</Link>
        </Button>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CheckoutSuccessInner />
    </Suspense>
  );
}
