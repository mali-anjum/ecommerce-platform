"use client";

import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/components/ui/hooks/use-toast";
import { useOrderStore } from "@/components/storefront/orders/state/useOrderStore";
import type { Order } from "@/components/storefront/orders/types/orderTypes";
import { useEffect, useState } from "react";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  User,
  ShoppingBag,
  CreditCard,
  Eye,
  Download,
  Filter,
  Search,
  TrendingUp,
  AlertCircle,
  BarChart3,
  RefreshCw,
  MoreVertical,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Hash,
  Sparkles,
  Zap,
  XCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

type OrderStatus = Order["status"];

// ==================== MODULAR COMPONENTS ====================

// 1. Order Status Badge Component
interface OrderStatusBadgeProps {
  status: OrderStatus;
}

function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusConfig = {
    PENDING: {
      color: "bg-warning/20 text-warning border-warning/20",
      icon: <Clock className="h-3 w-3" />,
      label: "Pending",
    },
    PROCESSING: {
      color: "bg-secondary/20 text-secondary border-secondary/20",
      icon: <RefreshCw className="h-3 w-3" />,
      label: "Processing",
    },
    SHIPPED: {
      color: "bg-primary/20 text-primary border-primary/20",
      icon: <Truck className="h-3 w-3" />,
      label: "Shipped",
    },
    DELIVERED: {
      color: "bg-success/20 text-success border-success/20",
      icon: <CheckCircle className="h-3 w-3" />,
      label: "Delivered",
    },
    DRAFT: {
      color: "bg-muted text-muted-foreground border-border",
      icon: <Clock className="h-3 w-3" />,
      label: "Draft",
    },
    PENDING_PAYMENT: {
      color: "bg-warning/20 text-warning border-warning/20",
      icon: <CreditCard className="h-3 w-3" />,
      label: "Pending Payment",
    },
    PAYMENT_APPROVED: {
      color: "bg-primary/20 text-primary border-primary/20",
      icon: <CheckCircle className="h-3 w-3" />,
      label: "Payment Approved",
    },
    CANCELLED: {
      color: "bg-destructive/20 text-destructive border-destructive/20",
      icon: <XCircle className="h-3 w-3" />,
      label: "Cancelled",
    },
    PAYMENT_FAILED: {
      color: "bg-destructive/20 text-destructive border-destructive/20",
      icon: <XCircle className="h-3 w-3" />,
      label: "Payment Failed",
    },
    CAPTURE_FAILED: {
      color: "bg-destructive/20 text-destructive border-destructive/20",
      icon: <XCircle className="h-3 w-3" />,
      label: "Capture Failed",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

// 2. Payment Status Badge Component
interface PaymentStatusBadgeProps {
  status: string;
  orderStatus?: OrderStatus;
}

function PaymentStatusBadge({ status, orderStatus }: PaymentStatusBadgeProps) {
  const normalizedStatus = String(status || "").toUpperCase();
  const effectiveStatus =
    normalizedStatus === "PENDING" &&
    (orderStatus === "PAYMENT_FAILED" || orderStatus === "CAPTURE_FAILED")
      ? "FAILED"
      : normalizedStatus;

  const paymentStateMap: Record<
    string,
    { label: string; color: string }
  > = {
    COMPLETED: {
      label: "Paid",
      color: "bg-success/20 text-success border-success/20",
    },
    PAID: {
      label: "Paid",
      color: "bg-success/20 text-success border-success/20",
    },
    APPROVED: {
      label: "Approved",
      color: "bg-primary/20 text-primary border-primary/20",
    },
    PENDING: {
      label: "Pending",
      color: "bg-warning/20 text-warning border-warning/20",
    },
    AUTHORIZED: {
      label: "Authorized",
      color: "bg-primary/20 text-primary border-primary/20",
    },
    FAILED: {
      label: "Failed",
      color: "bg-destructive/20 text-destructive border-destructive/20",
    },
    CANCELLED: {
      label: "Cancelled",
      color: "bg-destructive/20 text-destructive border-destructive/20",
    },
    REFUNDED: {
      label: "Refunded",
      color: "bg-muted text-muted-foreground border-border",
    },
  };

  const mappedState = paymentStateMap[effectiveStatus] ?? {
    label: effectiveStatus || "Unknown",
    color: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge className={`${mappedState.color} flex items-center gap-1`}>
      <CreditCard className="h-3 w-3" />
      {mappedState.label}
    </Badge>
  );
}

// 3. Order Card Component (for mobile/alternative view)
interface OrderCardProps {
  order: any;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
  onViewDetails: (orderId: string) => void;
}

function OrderCard({ order, onStatusUpdate, onViewDetails }: OrderCardProps) {
  const totalItems = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return (
    <Card className="glass-effect border border-glass-border overflow-hidden">
      <CardContent className="p-4">
        {/* Order Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <code className="font-mono font-bold text-foreground">
                #{order.id.slice(0, 8)}...
              </code>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(order.createdAt), "MMM dd, yyyy")}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(order.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Customer Info */}
        <div className="mb-4 p-3 rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{order.user.name}</p>
              <p className="text-xs text-muted-foreground">{order.user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{order.shippingAddress?.city || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{order.user.phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ShoppingBag className="h-3 w-3" />
              Items
            </div>
            <p className="text-lg font-bold text-foreground">
              {totalItems} {totalItems > 1 ? 'items' : 'item'}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Total
            </div>
            <p className="text-lg font-bold text-primary">
              ${order.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mb-4">
          <PaymentStatusBadge status={order.paymentStatus} orderStatus={order.status} />
        </div>

        {/* Status Update */}
        <Select
          defaultValue={order.status}
          onValueChange={(value) => onStatusUpdate(order.id, value as OrderStatus)}
        >
          <SelectTrigger className="w-full bg-input border-border">
            <SelectValue placeholder="Update Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="PENDING" className="hover:bg-warning/10">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Pending
              </div>
            </SelectItem>
            <SelectItem value="PROCESSING" className="hover:bg-secondary/10">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-secondary" />
                Processing
              </div>
            </SelectItem>
            <SelectItem value="SHIPPED" className="hover:bg-primary/10">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Shipped
              </div>
            </SelectItem>
            <SelectItem value="DELIVERED" className="hover:bg-success/10">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Delivered
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

// 4. Stats Overview Component
function OrdersStats({ orders }: { orders: any[] }) {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
      trend: "+12%",
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-secondary",
      bg: "bg-secondary/10",
      trend: "+18%",
    },
    {
      label: "Avg Order Value",
      value: `$${avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-accent",
      bg: "bg-accent/10",
      trend: "+5%",
    },
    {
      label: "Pending Orders",
      value: orders.filter(o => o.status === "PENDING").length,
      icon: AlertCircle,
      color: "text-warning",
      bg: "bg-warning/10",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="glass-effect border border-glass-border"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              {stat.trend && (
                <Badge variant="outline" className="border-primary text-primary text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.trend}
                </Badge>
              )}
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 5. Quick Actions Component
function OrdersQuickActions({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <Button
        onClick={onRefresh}
        variant="outline"
        className="border-border hover:border-primary"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh Orders
      </Button>
      
      <Button variant="outline" className="border-border">
        <Download className="h-4 w-4 mr-2" />
        Export Data
      </Button>
      
      <Button variant="outline" className="border-border">
        <BarChart3 className="h-4 w-4 mr-2" />
        Analytics
      </Button>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

function SuperAdminManageOrdersPage() {
  const { getAllOrdersForAdmin, adminOrders, updateOrderStatus } = useOrderStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      await getAllOrdersForAdmin();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: "Status Updated",
        description: `Order status updated to ${newStatus.toLowerCase()}`,
        className: "bg-success/10 border-success/20 text-success",
      });
      loadOrders(); // Refresh orders
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (orderId: string) => {
    // Implement order details view
    console.log("View order details:", orderId);
  };

  // Filter orders
  const filteredOrders = adminOrders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="glass-effect rounded-2xl p-6 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-xl bg-primary/20 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Orders Management
                </h1>
                <p className="text-muted-foreground">
                  Manage customer orders and track fulfillment
                </p>
              </div>
            </div>
            
            <OrdersQuickActions onRefresh={loadOrders} />
          </div>
        </header>

        {/* Stats Overview */}
        <OrdersStats orders={adminOrders} />

        {/* Controls Section */}
        <div className="glass-effect rounded-xl p-4 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border focus:ring-primary/50"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-card rounded-lg p-1">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={viewMode === "table" ? "bg-primary text-primary-foreground" : ""}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-primary text-primary-foreground" : ""}
                >
                  Grid
                </Button>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-input border-border rounded-lg px-3 py-2 text-sm focus:ring-primary/50 focus:border-primary"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
              </select>

              <Button variant="outline" size="icon" className="border-border">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <div>
                <p className="font-medium text-foreground">Loading Orders</p>
                <p className="text-sm text-muted-foreground">Fetching order data...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              /* Table View */
              <div className="glass-effect rounded-xl border border-glass-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[140px]">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Order ID
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Total
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Items
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Status
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Actions
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Package className="h-8 w-8 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">No orders found</p>
                                <p className="text-sm text-muted-foreground">
                                  {searchQuery ? "Try a different search term" : "All orders are processed"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => {
                          const totalItems = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

                          return (
                            <TableRow 
                              key={order.id} 
                              className="hover:bg-primary/5 group transition-colors"
                            >
                              <TableCell>
                                <div className="space-y-1">
                                  <code className="font-mono font-medium text-foreground">
                                    #{order.id.slice(0, 8)}...
                                  </code>
                                  <div className="text-xs text-muted-foreground">
                                    {order.id}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-foreground">
                                    {format(new Date(order.createdAt), "MMM dd")}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(order.createdAt), "hh:mm a")}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-foreground">
                                    {order.user.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {order.user.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <span className="text-lg font-bold text-primary">
                                    ${order.total.toFixed(2)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <PaymentStatusBadge status={order.paymentStatus} orderStatus={order.status} />
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-foreground">
                                    {totalItems} {totalItems > 1 ? 'items' : 'item'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {order.items.length} products
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <OrderStatusBadge status={order.status} />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Select
                                    defaultValue={order.status}
                                    onValueChange={(value) => 
                                      handleStatusUpdate(order.id, value as OrderStatus)
                                    }
                                  >
                                    <SelectTrigger className="w-[140px] bg-input border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                      <SelectItem value="PENDING">
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-warning" />
                                          Pending
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="PROCESSING">
                                        <div className="flex items-center gap-2">
                                          <RefreshCw className="h-4 w-4 text-secondary" />
                                          Processing
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="SHIPPED">
                                        <div className="flex items-center gap-2">
                                          <Truck className="h-4 w-4 text-primary" />
                                          Shipped
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="DELIVERED">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="h-4 w-4 text-success" />
                                          Delivered
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewDetails(order.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Footer Stats */}
            {filteredOrders.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>
                    Showing <span className="font-semibold text-foreground">{filteredOrders.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{adminOrders.length}</span> orders
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-warning"></div>
                    Pending: {adminOrders.filter(o => o.status === "PENDING").length}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-secondary"></div>
                    Processing: {adminOrders.filter(o => o.status === "PROCESSING").length}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    Shipped: {adminOrders.filter(o => o.status === "SHIPPED").length}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-success"></div>
                    Delivered: {adminOrders.filter(o => o.status === "DELIVERED").length}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SuperAdminManageOrdersPage;