"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderList from "@/components/orders/OrderList";
import OrderDetailsPanel from "@/components/orders/OrderDetailsPanel";

export default function TrackOrderPage() {
  const {
    userOrders,
    currentOrder,
    isLoading,
    error,
    getAllOrders,
    getOrderForUser,
    setCurrentOrder,
  } = useOrderStore();

  const fetchedRef = useRef(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "details">("orders");

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    getAllOrders();
  }, [getAllOrders]);

  const ordersSorted = useMemo(() => {
    const rows = userOrders ?? [];
    return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [userOrders]);

  useEffect(() => {
    if (ordersSorted.length === 0) return;
    if (selectedOrderId) return;
    setSelectedOrderId(ordersSorted[0].id);
  }, [ordersSorted, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrderId) return;
    const minimal = ordersSorted.find((o) => o.id === selectedOrderId) ?? null;
    // Show something immediately in the details panel while "Track now" fetches full data.
    setCurrentOrder(minimal);
  }, [ordersSorted, selectedOrderId, setCurrentOrder]);

  async function handleTrackNow(orderId: string) {
    setSelectedOrderId(orderId);
    setActiveTab("details");
    await getOrderForUser(orderId);
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My orders</h1>
        <p className="mt-2 text-muted-foreground">
          View all your orders and track delivery progress.
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {/* Mobile: tabbed. Desktop: two-column. */}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderList
                orders={ordersSorted}
                selectedOrderId={selectedOrderId}
                onSelect={(orderId) => setSelectedOrderId(orderId)}
                onTrackNow={handleTrackNow}
              />
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:block">
          <OrderDetailsPanel order={currentOrder} isLoading={isLoading} />
        </div>

        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="orders" className="flex-1">
                Orders
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-1">
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderList
                    orders={ordersSorted}
                    selectedOrderId={selectedOrderId}
                    onSelect={(orderId) => setSelectedOrderId(orderId)}
                    onTrackNow={handleTrackNow}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <OrderDetailsPanel order={currentOrder} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
