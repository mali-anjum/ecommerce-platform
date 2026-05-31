"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCouponStore } from "@/components/storefront/checkout/state/useCouponStore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Copy, 
  BarChart3,
  Ticket,
  Calendar,
  Percent,
  Hash,
  Zap,
  Sparkles,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Users,
  Shield
} from "lucide-react";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

// ==================== MODULAR COMPONENTS ====================

// 1. Coupon Status Badge Component
interface CouponStatusBadgeProps {
  coupon: any;
}

function CouponStatusBadge({ coupon }: CouponStatusBadgeProps) {
  const now = new Date();
  const startDate = new Date(coupon.startDate);
  const endDate = new Date(coupon.endDate);
  const isExpired = isAfter(now, endDate);
  const isUpcoming = isBefore(now, startDate);
  const isActive = !isExpired && !isUpcoming;
  const usagePercentage = coupon.usageLimit > 0 
    ? (coupon.usageCount / coupon.usageLimit) * 100 
    : 0;

  if (isExpired) {
    return (
      <Badge className="bg-destructive/20 text-destructive border-destructive/20">
        <XCircle className="h-3 w-3 mr-1" />
        Expired
      </Badge>
    );
  }

  if (isUpcoming) {
    return (
      <Badge className="bg-warning/20 text-warning border-warning/20">
        <Clock className="h-3 w-3 mr-1" />
        Upcoming
      </Badge>
    );
  }

  if (usagePercentage >= 100) {
    return (
      <Badge className="bg-accent/20 text-accent border-accent/20">
        <AlertCircle className="h-3 w-3 mr-1" />
        Fully Used
      </Badge>
    );
  }

  return (
    <Badge className="bg-success/20 text-success border-success/20">
      <CheckCircle className="h-3 w-3 mr-1" />
      Active
    </Badge>
  );
}

// 2. Coupon Card Component (for mobile/alternative view)
interface CouponCardProps {
  coupon: any;
  onDelete: (id: string) => void;
  onCopy: (code: string) => void;
  onView: (id: string) => void;
}

function CouponCard({ coupon, onDelete, onCopy, onView }: CouponCardProps) {
  const now = new Date();
  const daysRemaining = differenceInDays(new Date(coupon.endDate), now);
  const usagePercentage = coupon.usageLimit > 0 
    ? (coupon.usageCount / coupon.usageLimit) * 100 
    : 0;

  return (
    <Card className="glass-effect border border-glass-border overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <code className="text-xl font-bold tracking-widest text-foreground font-mono">
                {coupon.code}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCopy(coupon.code)}
                className="h-6 w-6"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <CouponStatusBadge coupon={coupon} />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(coupon.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopy(coupon.code)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(coupon.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Discount Display */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {coupon.discountPercent}%
            </div>
            <span className="text-lg text-muted-foreground">OFF</span>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium text-foreground">
                {coupon.usageCount}/{coupon.usageLimit || '∞'}
              </span>
            </div>
            <div className="h-2 bg-card rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                <span>Starts</span>
              </div>
              <div className="font-medium text-foreground">
                {format(new Date(coupon.startDate), "MMM dd")}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                <span>Ends</span>
              </div>
              <div className="font-medium text-foreground">
                {format(new Date(coupon.endDate), "MMM dd")}
              </div>
            </div>
          </div>

          {/* Days Remaining */}
          {daysRemaining > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time Left</span>
              <span className="font-medium text-foreground">
                {daysRemaining} days
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 3. Stats Overview Component
function StatsOverview({ coupons }: { coupons: any[] }) {
  const now = new Date();
  
  const activeCoupons = coupons.filter(coupon => {
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);
    return now >= start && now <= end;
  }).length;

  const expiredCoupons = coupons.filter(coupon => 
    new Date(coupon.endDate) < now
  ).length;

  const upcomingCoupons = coupons.filter(coupon => 
    new Date(coupon.startDate) > now
  ).length;

  const totalDiscount = coupons.reduce((sum, coupon) => 
    sum + coupon.discountPercent, 0
  );

  const stats = [
    {
      label: "Active Coupons",
      value: activeCoupons,
      icon: Ticket,
      color: "text-primary",
      bg: "bg-primary/10",
      trend: "+12%",
    },
    {
      label: "Total Discount",
      value: `${totalDiscount}%`,
      icon: Percent,
      color: "text-secondary",
      bg: "bg-secondary/10",
      trend: "+8%",
    },
    {
      label: "Expired",
      value: expiredCoupons,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      trend: null,
    },
    {
      label: "Upcoming",
      value: upcomingCoupons,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
      trend: "+5%",
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

// 4. Quick Actions Component
function QuickActions({ onAddCoupon }: { onAddCoupon: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <Button
        onClick={onAddCoupon}
        className="bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-primary-foreground"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New Coupon
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

function SuperAdminCouponsListingPage() {
  const { isLoading, couponList, fetchCoupons, deleteCoupon } =
    useCouponStore();
  const router = useRouter();
  const fetchCouponRef = useRef(false);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useEffect(() => {
    if (!fetchCouponRef.current) {
      fetchCoupons();
      fetchCouponRef.current = true;
    }
  }, [fetchCoupons]);

  const handleDeleteCoupon = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      const result = await deleteCoupon(id);
      if (result) {
        toast({
          title: "Coupon Deleted",
          description: "Coupon has been deleted successfully",
          className: "bg-success/10 border-success/20 text-success",
        });
        fetchCoupons();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete coupon",
          variant: "destructive",
        });
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to Clipboard",
      description: `Code "${code}" copied successfully`,
    });
  };

  const handleViewCoupon = (id: string) => {
    // You could implement a detailed view modal here
    console.log("View coupon:", id);
  };

  // Filter coupons
  const filteredCoupons = couponList.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);
    
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = now >= start && now <= end;
    } else if (statusFilter === "expired") {
      matchesStatus = now > end;
    } else if (statusFilter === "upcoming") {
      matchesStatus = now < start;
    }
    
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
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-xl bg-primary/20 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Coupon Management
                </h1>
                <p className="text-muted-foreground">
                  Manage discount codes and promotional campaigns
                </p>
              </div>
            </div>
            
            <QuickActions onAddCoupon={() => router.push("/super-admin/coupons/add")} />
          </div>
        </header>

        {/* Stats Overview */}
        <StatsOverview coupons={couponList} />

        {/* Controls Section */}
        <div className="glass-effect rounded-xl p-4 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coupon codes..."
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
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
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
                <p className="font-medium text-foreground">Loading Coupons</p>
                <p className="text-sm text-muted-foreground">Fetching promotional data...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCoupons.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    onDelete={handleDeleteCoupon}
                    onCopy={handleCopyCode}
                    onView={handleViewCoupon}
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
                        <TableHead className="w-[180px]">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4" />
                            Code
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            Discount
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Usage
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Dates
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
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
                      {filteredCoupons.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Ticket className="h-8 w-8 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">No coupons found</p>
                                <p className="text-sm text-muted-foreground">
                                  {searchQuery ? "Try a different search term" : "Create your first coupon to get started"}
                                </p>
                              </div>
                              {!searchQuery && (
                                <Button
                                  onClick={() => router.push("/super-admin/coupons/add")}
                                  variant="outline"
                                  className="mt-2"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Coupon
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCoupons.map((coupon) => {
                          const usagePercentage = coupon.usageLimit > 0 
                            ? (coupon.usageCount / coupon.usageLimit) * 100 
                            : 0;
                          const daysRemaining = differenceInDays(new Date(coupon.endDate), new Date());

                          return (
                            <TableRow 
                              key={coupon.id} 
                              className="hover:bg-primary/5 group transition-colors"
                            >
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono font-bold text-foreground">
                                      {coupon.code}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleCopyCode(coupon.code)}
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ID: {coupon.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                    {coupon.discountPercent}%
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    OFF
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-foreground">
                                      {coupon.usageCount}/{coupon.usageLimit || '∞'}
                                    </span>
                                    {coupon.usageLimit > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        {usagePercentage.toFixed(0)}%
                                      </span>
                                    )}
                                  </div>
                                  <div className="h-1 bg-card rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">From: </span>
                                    <span className="font-medium text-foreground">
                                      {format(new Date(coupon.startDate), "MMM dd, yyyy")}
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">To: </span>
                                    <span className="font-medium text-foreground">
                                      {format(new Date(coupon.endDate), "MMM dd, yyyy")}
                                    </span>
                                  </div>
                                  {daysRemaining > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {daysRemaining} days remaining
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <CouponStatusBadge coupon={coupon} />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    onClick={() => handleCopyCode(coupon.code)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
            {filteredCoupons.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>
                    Showing <span className="font-semibold text-foreground">{filteredCoupons.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{couponList.length}</span> coupons
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-success"></div>
                    Active: {couponList.filter(c => 
                      new Date() >= new Date(c.startDate) && new Date() <= new Date(c.endDate)
                    ).length}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-warning"></div>
                    Upcoming: {couponList.filter(c => new Date() < new Date(c.startDate)).length}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-destructive"></div>
                    Expired: {couponList.filter(c => new Date() > new Date(c.endDate)).length}
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

export default SuperAdminCouponsListingPage;