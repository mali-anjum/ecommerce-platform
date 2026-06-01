export type AnalyticsPeriod = "7d" | "30d" | "90d" | "365d";

export interface AnalyticsDateRange {
  period: AnalyticsPeriod;
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
}

export interface AnalyticsKpis {
  totalRevenue: number;
  revenueChangePercent: number;
  totalOrders: number;
  ordersChangePercent: number;
  averageOrderValue: number;
  aovChangePercent: number;
  totalCustomers: number;
  newCustomers: number;
  newCustomersChangePercent: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  wishlistItems: number;
  activeCarts: number;
  activeCoupons: number;
  refundRate: number;
  fulfillmentRate: number;
}

export interface TrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  revenue: number;
}

export interface PaymentBreakdown {
  method: string;
  count: number;
  revenue: number;
}

export interface TopProductRow {
  id: string;
  name: string;
  category: string;
  revenue: number;
  unitsSold: number;
  stock: number;
}

export interface TopCategoryRow {
  category: string;
  revenue: number;
  unitsSold: number;
  productCount: number;
}

export interface GeographicRow {
  country: string;
  orders: number;
  revenue: number;
  sharePercent: number;
}

export interface CustomerGrowthPoint {
  date: string;
  newUsers: number;
}

export interface HourlyDistribution {
  hour: number;
  orders: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  rateFromPrevious: number;
}

export interface InventoryHealth {
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface CouponPerformanceRow {
  id: string;
  code: string;
  usageCount: number;
  usageLimit: number;
  discountPercent: number;
  isActive: boolean;
}

export interface RecentOrderRow {
  id: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string;
  itemCount: number;
}

export interface SellerPerformanceRow {
  id: string;
  name: string;
  revenue: number;
  unitsSold: number;
  productCount: number;
}

export interface AiMetricsSummary {
  chatUsageCount: number;
  chatUsageChangePercent: number;
  conversionRate: number;
  convertedChats: number;
  topIntents: Array<{ intent: string; count: number }>;
}

export interface FunnelTrackingSummary {
  chat: number;
  productView: number;
  cartAdd: number;
  orderComplete: number;
  chatToProductViewRate: number;
  productViewToCartRate: number;
  cartToOrderRate: number;
  overallConversionRate: number;
  sessionCounts: {
    startedChat: number;
    reachedProductView: number;
    reachedCart: number;
    completedOrder: number;
  };
}

export interface AnalyticsDashboard {
  period: AnalyticsPeriod;
  generatedAt: string;
  kpis: AnalyticsKpis;
  revenueTrend: TrendPoint[];
  orderStatusBreakdown: StatusBreakdown[];
  paymentMethodBreakdown: PaymentBreakdown[];
  topProducts: TopProductRow[];
  topCategories: TopCategoryRow[];
  geographicSales: GeographicRow[];
  customerGrowth: CustomerGrowthPoint[];
  hourlyOrderDistribution: HourlyDistribution[];
  conversionFunnel: FunnelStage[];
  inventoryHealth: InventoryHealth;
  couponPerformance: CouponPerformanceRow[];
  recentOrders: RecentOrderRow[];
  sellerPerformance: SellerPerformanceRow[];
  aiMetrics: AiMetricsSummary;
  funnelTracking: FunnelTrackingSummary;
}
