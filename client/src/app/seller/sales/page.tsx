"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/store/useAuthStore";
import { useOrderStore } from "@/store/useOrderStore";
import type { SellerOrderLine } from "@/types/order/orderTypes";

export default function SellerSalesPage() {
  const user = useAuthStore((s) => s.user);
  const { isLoading, error, getSellerSalesLines } = useOrderStore();
  const [items, setItems] = useState<SellerOrderLine[]>([]);

  useEffect(() => {
    if (user?.role !== "SELLER") {
      setItems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const lines = await getSellerSalesLines();
      if (!cancelled) {
        setItems(lines ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getSellerSalesLines, user?.role]);

  if (!user) {
    return (
      <div className="p-8 text-muted-foreground">
        <Link href="/auth/login" className="text-primary underline">
          Sign in
        </Link>{" "}
        to view sales.
      </div>
    );
  }

  if (user.role !== "SELLER") {
    return (
      <div className="p-8 text-muted-foreground">
        Seller account required.{" "}
        <Link href="/seller/register" className="text-primary underline">
          Register as seller
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading sales…</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Your order lines</h1>
        <p className="text-sm text-muted-foreground">
          Each row is a line item from a customer order where the product was yours.
          Useful for fulfillment and revenue tracking.
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Line total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No sales yet. When customers buy your products, lines appear here.
                </TableCell>
              </TableRow>
            ) : (
              items.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-xs">
                    {line.order?.id?.slice(0, 8)}…
                  </TableCell>
                  <TableCell>{line.product?.name ?? "—"}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>
                    ${(line.price * line.quantity).toFixed(2)}
                  </TableCell>
                  <TableCell>{line.order?.status}</TableCell>
                  <TableCell>{line.order?.paymentStatus}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
