"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOrderStore } from "@/components/storefront/orders/state/useOrderStore";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountOrdersSidebar } from "@/components/storefront/orders/organisms/AccountOrdersSidebar";
import { OrderStatusTabs } from "@/components/storefront/orders/molecules/OrderStatusTabs";
import OrderList from "@/components/storefront/orders/organisms/OrderList";
import OrderDetailsPanel from "@/components/storefront/orders/organisms/OrderDetailsPanel";
import {
  countOrdersByTab,
  filterOrdersBySearch,
  filterOrdersByTab,
  type OrderListTab,
} from "@/components/storefront/orders/utils/orderFilters";

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
  const [activeTab, setActiveTab] = useState<OrderListTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "details">("list");

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    getAllOrders();
  }, [getAllOrders]);

  const ordersSorted = useMemo(() => {
    const rows = userOrders ?? [];
    return [...rows].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  }, [userOrders]);

  const tabCounts = useMemo(
    () => countOrdersByTab(ordersSorted),
    [ordersSorted]
  );

  const filteredOrders = useMemo(() => {
    const byTab = filterOrdersByTab(ordersSorted, activeTab);
    return filterOrdersBySearch(byTab, searchQuery);
  }, [ordersSorted, activeTab, searchQuery]);

  useEffect(() => {
    if (filteredOrders.length === 0) {
      setSelectedOrderId(null);
      setCurrentOrder(null);
      return;
    }
    const stillVisible = filteredOrders.some((o) => o.id === selectedOrderId);
    if (!stillVisible) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId, setCurrentOrder]);

  useEffect(() => {
    if (!selectedOrderId) return;
    const minimal = ordersSorted.find((o) => o.id === selectedOrderId) ?? null;
    setCurrentOrder(minimal);
    void getOrderForUser(selectedOrderId);
  }, [selectedOrderId, ordersSorted, getOrderForUser, setCurrentOrder]);

  const handleSelectOrder = (orderId: string) => {
    if (orderId === selectedOrderId) return;
    setSelectedOrderId(orderId);
    setMobileView("details");
  };

  const listPanel = (
    <div className="space-y-4">
      <OrderStatusTabs
        activeTab={activeTab}
        counts={tabCounts}
        onChange={setActiveTab}
      />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by product name or order ID"
          className="pl-9"
        />
      </div>
      <OrderList
        orders={filteredOrders}
        selectedOrderId={selectedOrderId}
        onSelect={handleSelectOrder}
      />
    </div>
  );

  const detailsPanel = (
    <OrderDetailsPanel order={currentOrder} isLoading={isLoading} />
  );

  return (
    <main className="bg-linear-to-b from-background to-card/30 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex gap-8">
          <AccountOrdersSidebar />

          <div className="min-w-0 flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
              <p className="mt-1 text-muted-foreground">
                Track packages, view order details, and manage your purchases.
              </p>
            </div>

            {error && (
              <p className="mb-4 text-sm text-destructive">{error}</p>
            )}

            <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <section>{listPanel}</section>
              <section>{detailsPanel}</section>
            </div>

            <div className="lg:hidden">
              <Tabs
                value={mobileView}
                onValueChange={(v) => setMobileView(v as "list" | "details")}
              >
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="list" className="flex-1">
                    Orders
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex-1" disabled={!selectedOrderId}>
                    Details
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="list">{listPanel}</TabsContent>
                <TabsContent value="details">
                  {detailsPanel}
                  {selectedOrderId && (
                    <button
                      type="button"
                      className="mt-4 text-sm text-primary hover:underline"
                      onClick={() => setMobileView("list")}
                    >
                      ← Back to orders
                    </button>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
