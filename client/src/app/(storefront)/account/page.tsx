
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useAddressStore } from "@/components/storefront/checkout/state/useAddressStore";
import type { Address } from "@/components/storefront/checkout/types/Address";
import type { Order } from "@/components/storefront/orders/types/orderTypes";
import { useOrderStore } from "@/components/storefront/orders/state/useOrderStore";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  User, 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  ShoppingBag,
  Truck,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
  Home,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Shield,
  Sparkles,
  Zap,
  TrendingUp,
  AlertCircle,
  Loader2,
  Heart,
  Settings,
  Bell,
  RefreshCw,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sentryTracker } from "@/lib/monitoring";

const initialAddressFormState = {
  name: "",
  address: "",
  city: "",
  country: "",
  postalCode: "",
  phone: "",
  isDefault: false,
};

// ==================== MODULAR COMPONENTS ====================

// 1. Order Status Badge Component
interface OrderStatusBadgeProps {
  status: Order["status"];
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
      icon: <Package className="h-3 w-3" />,
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

// 2. Address Card Component
interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
}

function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  return (
    <Card className="glass-effect border border-glass-border hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${address.isDefault ? 'bg-primary/20' : 'bg-card'} flex items-center justify-center`}>
              <MapPin className={`h-5 w-5 ${address.isDefault ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground">{address.name}</p>
                {address.isDefault && (
                  <Badge className="bg-primary/20 text-primary border-primary/20 text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Shipping Address</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onEdit(address)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Address</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onDelete(address.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Address</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Home className="h-4 w-4 text-muted-foreground" />
            <p className="text-foreground">{address.address}</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <p className="text-foreground">
              {address.city}, {address.country} {address.postalCode}
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <p className="text-foreground">{address.phone}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 3. User Stats Component
function UserStats({ orderCount, totalSpent }: { orderCount: number; totalSpent: number }) {
  const stats = [
    {
      label: "Total Orders",
      value: orderCount,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Spent",
      value: `$${totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "Wishlist Items",
      value: "12",
      icon: Heart,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Member Since",
      value: "2024",
      icon: User,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              {index === 0 && orderCount > 0 && (
                <Badge variant="outline" className="border-primary text-primary text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            <div className="mt-3">
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 4. Address Form Component
interface AddressFormProps {
  formData: typeof initialAddressFormState;
  editingAddress: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  onChange: (field: string, value: string | boolean) => void;
  isLoading: boolean;
}

function AddressForm({ 
  formData, 
  editingAddress, 
  onSubmit, 
  onCancel, 
  onChange,
  isLoading 
}: AddressFormProps) {
  return (
    <Card className="glass-effect border border-glass-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {editingAddress ? "Edit Address" : "Add New Address"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {editingAddress ? "Update your address details" : "Add a new shipping address"}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                required
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Enter your full name"
                className="bg-input border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                required
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder="Enter your phone number"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Street Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              required
              onChange={(e) => onChange("address", e.target.value)}
              placeholder="Enter your street address"
              className="bg-input border-border"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                City
              </Label>
              <Input
                id="city"
                value={formData.city}
                required
                onChange={(e) => onChange("city", e.target.value)}
                placeholder="Enter your city"
                className="bg-input border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Country
              </Label>
              <Input
                id="country"
                value={formData.country}
                required
                onChange={(e) => onChange("country", e.target.value)}
                placeholder="Enter your country"
                className="bg-input border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Postal Code
              </Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                required
                onChange={(e) => onChange("postalCode", e.target.value)}
                placeholder="Enter postal code"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 rounded-lg bg-card">
            <Checkbox
              id="default"
              checked={formData.isDefault}
              onCheckedChange={(checked) => onChange("isDefault", checked as boolean)}
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="default" className="text-sm cursor-pointer">
              Set as default shipping address
            </Label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-linear-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-primary-foreground"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {editingAddress ? "Update Address" : "Add Address"}
                </div>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-border hover:border-primary"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ==================== MAIN COMPONENT ====================

function UserAccountPage() {
  const {
    isLoading: addressesLoading,
    addresses,
    error: addressesError,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
  } = useAddressStore();
  
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialAddressFormState);
  const [activeTab, setActiveTab] = useState<"orders" | "addresses">("orders");
  const { toast } = useToast();
  const { userOrders, getAllOrders, isLoading: ordersLoading } = useOrderStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetchAddresses();
    getAllOrders();
  }, [fetchAddresses, getAllOrders]);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    setActiveTab(requestedTab === "addresses" ? "addresses" : "orders");
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    const nextTab = value === "addresses" ? "addresses" : "orders";
    setActiveTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "addresses") {
      params.set("tab", "addresses");
    } else {
      params.delete("tab");
      setShowAddressForm(false);
      setEditingAddress(null);
    }

    const nextQuery = params.toString();
    router.replace(nextQuery ? `/account?${nextQuery}` : "/account");
  };

  const handleAddressSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (editingAddress) {
        const result = await updateAddress(editingAddress, formData);
        if (result) {
          toast({
            title: "Address Updated",
            description: "Your address has been updated successfully",
            className: "bg-success/10 border-success/20 text-success",
          });
          fetchAddresses();
          setEditingAddress(null);
        }
      } else {
        const result = await createAddress(formData);
        if (result) {
          toast({
            title: "Address Created",
            description: "New address has been added successfully",
            className: "bg-success/10 border-success/20 text-success",
          });
          fetchAddresses();
        }
      }

      setShowAddressForm(false);
      setFormData(initialAddressFormState);
    } catch (err) {
    sentryTracker(err, { source: "page" });
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditAddress = (address: Address) => {
    setFormData({
      name: address.name,
      address: address.address,
      city: address.city,
      country: address.country,
      phone: address.phone,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });

    setEditingAddress(address.id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (confirmed) {
      try {
        const success = await deleteAddress(id);
        if (success) {
          toast({
            title: "Address Deleted",
            description: "Address has been removed successfully",
            className: "bg-success/10 border-success/20 text-success",
          });
          fetchAddresses();
        }
      } catch (e) {
    sentryTracker(e, { source: "page" });
        toast({
          title: "Error",
          description: "Failed to delete address. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-card/20 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <header className="glass-effect rounded-2xl p-6 mb-8 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-xl bg-linear-to-br from-primary to-secondary flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-xl bg-primary/20 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  My Account
                </h1>
                <p className="text-muted-foreground">
                  Manage your orders, addresses, and account settings
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-border">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" className="border-border">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>
        </header>

        {/* User Stats */}
        <UserStats orderCount={userOrders.length} totalSpent={totalSpent} />

        {/* Main Content */}
        <div className="mt-8">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <TabsList className="glass-effect p-1 border border-glass-border">
              <TabsTrigger 
                value="orders" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Package className="h-4 w-4 mr-2" />
                Order History
              </TabsTrigger>
              <TabsTrigger 
                value="addresses" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Addresses
              </TabsTrigger>
            </TabsList>
            
            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card className="glass-effect border border-glass-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Order History
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Track and manage all your orders
                      </p>
                    </div>
                    
                    <Badge variant="outline" className="border-primary text-primary">
                      <Zap className="h-3 w-3 mr-1" />
                      {userOrders.length} Orders
                    </Badge>
                  </div>

                  {ordersLoading ? (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                        <div>
                          <p className="font-medium text-foreground">Loading Orders</p>
                          <p className="text-sm text-muted-foreground">Fetching your order history...</p>
                        </div>
                      </div>
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-foreground">
                            No Orders Yet
                          </h3>
                          <p className="text-muted-foreground">
                            Start shopping to see your orders here
                          </p>
                        </div>
                        <Button className="mt-2">
                          <Zap className="h-4 w-4 mr-2" />
                          Start Shopping
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[140px]">Order #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userOrders.map((order) => (
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
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-foreground">
                                    {order.items.length} {order.items.length > 1 ? 'items' : 'item'}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <OrderStatusBadge status={order.status} />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-border">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {order.paymentStatus}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-lg font-bold text-primary">
                                    ${order.total.toFixed(2)}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Addresses Tab */}
            <TabsContent value="addresses">
              {showAddressForm ? (
                <AddressForm
                  formData={formData}
                  editingAddress={editingAddress}
                  onSubmit={handleAddressSubmit}
                  onCancel={() => {
                    setShowAddressForm(false);
                    setEditingAddress(null);
                    setFormData(initialAddressFormState);
                  }}
                  onChange={handleFormChange}
                  isLoading={addressesLoading}
                />
              ) : (
                <Card className="glass-effect border border-glass-border">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          Shipping Addresses
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Manage your delivery addresses
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => {
                          setEditingAddress(null);
                          setFormData(initialAddressFormState);
                          setShowAddressForm(true);
                        }}
                        className="bg-linear-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-primary-foreground"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Address
                      </Button>
                    </div>

                    {addressesLoading ? (
                      <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                          <div>
                            <p className="font-medium text-foreground">Loading Addresses</p>
                            <p className="text-sm text-muted-foreground">Fetching your saved addresses...</p>
                          </div>
                        </div>
                      </div>
                    ) : addressesError ? (
                      <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold text-foreground">
                              Error Loading Addresses
                            </h3>
                            <p className="text-muted-foreground">
                              {addressesError}
                            </p>
                          </div>
                          <Button 
                            onClick={fetchAddresses}
                            variant="outline"
                            className="mt-2"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                          </Button>
                        </div>
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-8 w-8 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold text-foreground">
                              No Addresses Saved
                            </h3>
                            <p className="text-muted-foreground">
                              Add your first shipping address to get started
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address) => (
                          <AddressCard
                            key={address.id}
                            address={address}
                            onEdit={handleEditAddress}
                            onDelete={handleDeleteAddress}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default UserAccountPage;