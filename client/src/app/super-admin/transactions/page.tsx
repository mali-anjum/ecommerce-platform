"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import type {
  AdminTransaction,
  AdminTransactionsQuery
} from "@/types/order/orderTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Search } from "lucide-react";

const money = (value?: number | null, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value ?? 0);

function statusBadge(status: AdminTransaction["attemptStatus"]) {
  const map: Record<AdminTransaction["attemptStatus"], string> = {
    COMPLETED: "bg-success/20 text-success border-success/20",
    FAILED: "bg-destructive/20 text-destructive border-destructive/20",
    PENDING: "bg-warning/20 text-warning border-warning/20",
    AUTHORIZED: "bg-primary/20 text-primary border-primary/20",
    CANCELLED: "bg-muted text-muted-foreground border-border",
  };
  return map[status];
}

type MethodFilter = "all" | "PAYPAL" | "STRIPE" | "CREDIT_CARD";
type StatusFilter =
  | "all"
  | "PENDING"
  | "AUTHORIZED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export default function SuperAdminTransactionsPage() {
  const {
    adminTransactions: items,
    adminTransactionsSummary: summary,
    adminTransactionsMeta: meta,
    getAdminTransactions,
    isLoading,
    error,
  } = useOrderStore();
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<MethodFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const query = useMemo<AdminTransactionsQuery>(
    () => ({
      page,
      limit: 20,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(method !== "all" ? { method } : {}),
      ...(status !== "all" ? { status } : {}),
    }),
    [page, search, method, status]
  );

  useEffect(() => {
    const run = async () => {
      await getAdminTransactions(query);
    };

    void run();
  }, [getAdminTransactions, query]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-card/20 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Monitor payment attempts, settlements, and failures.
            </p>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold">{money(summary.totalAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{summary.totalTransactions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-success">{summary.completedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-destructive">{summary.failedCount}</p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Payment Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div className="relative lg:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Search by transaction/order/customer..."
                  className="pl-9"
                />
              </div>
              <Select
                value={method}
                onValueChange={(value) => {
                  setPage(1);
                  setMethod(value as MethodFilter);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                  <SelectItem value="STRIPE">Stripe</SelectItem>
                  <SelectItem value="CREDIT_CARD">Card</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(value) => {
                  setPage(1);
                  setStatus(value as StatusFilter);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="AUTHORIZED">Authorized</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{tx.id.slice(0, 10)}...</p>
                            <p className="text-xs text-muted-foreground">
                              Order: {tx.order.id.slice(0, 10)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{tx.order.user.name || "Customer"}</p>
                            <p className="text-xs text-muted-foreground">{tx.order.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-2 text-sm">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            {tx.method}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadge(tx.attemptStatus)}>{tx.attemptStatus}</Badge>
                        </TableCell>
                        <TableCell>
                          {money(tx.amount, tx.currency || tx.order.currency || "USD")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {Math.max(1, meta.totalPages)} ({meta.total} records)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoading || page >= Math.max(1, meta.totalPages)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
