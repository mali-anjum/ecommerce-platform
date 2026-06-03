import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  parseAnalyticsPeriod,
  percentChange,
  resolveAnalyticsDateRange,
  toDateKey,
} from "./period";
import type {
  AnalyticsDashboard,
  AnalyticsPeriod,
  FunnelStage,
  TrendPoint,
} from "./types";
import { fetchAiMetricsSummary } from "../ai/analytics/AiAnalyticsService";
import { fetchFunnelTrackingSummary } from "./funnelAnalyticsService";

const COMPLETED_ORDER_WHERE: Prisma.OrderWhereInput = {
  paymentStatus: "COMPLETED",
};

const LOW_STOCK_THRESHOLD = 10;

function completedOrdersInRange(start: Date, end: Date): Prisma.OrderWhereInput {
  return {
    ...COMPLETED_ORDER_WHERE,
    createdAt: { gte: start, lte: end },
  };
}

function buildTrendSeries(
  orders: { createdAt: Date; total: number }[],
  start: Date,
  end: Date,
): TrendPoint[] {
  const buckets = new Map<string, { revenue: number; orders: number }>();
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  while (cursor <= endDay) {
    buckets.set(toDateKey(cursor), { revenue: 0, orders: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const order of orders) {
    const key = toDateKey(order.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += order.total;
    bucket.orders += 1;
  }

  return Array.from(buckets.entries()).map(([date, value]) => ({
    date,
    revenue: Number(value.revenue.toFixed(2)),
    orders: value.orders,
  }));
}

export async function fetchAnalyticsDashboard(
  periodRaw: unknown,
): Promise<AnalyticsDashboard> {
  const period = parseAnalyticsPeriod(periodRaw);
  const range = resolveAnalyticsDateRange(period);
  const { start, end, previousStart, previousEnd } = range;

  const currentOrderWhere = completedOrdersInRange(start, end);
  const previousOrderWhere = completedOrdersInRange(previousStart, previousEnd);

  const [
    currentOrders,
    previousOrders,
    orderStatusGroups,
    paymentGroups,
    orderLineItems,
    geographicGroups,
    newUsersInRange,
    previousNewUsers,
    totalUsers,
    productCounts,
    lowStockCount,
    outOfStockCount,
    wishlistCount,
    activeCartCount,
    activeCouponCount,
    refundedOrders,
    deliveredOrders,
    shippedOrDelivered,
    allUsersForGrowth,
    recentOrdersRaw,
    coupons,
    cartsWithItems,
    totalOrdersAllStatuses,
    aiMetrics,
    funnelTracking,
  ] = await Promise.all([
    prisma.order.findMany({
      where: currentOrderWhere,
      select: { id: true, total: true, createdAt: true, paymentMethod: true },
    }),
    prisma.order.findMany({
      where: previousOrderWhere,
      select: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: currentOrderWhere,
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.orderItem.findMany({
      where: {
        order: currentOrderWhere,
        productId: { not: null },
      },
      select: {
        productId: true,
        productName: true,
        productCategory: true,
        quantity: true,
        price: true,
        sellerId: true,
      },
    }),
    prisma.order.groupBy({
      by: ["addressId"],
      where: currentOrderWhere,
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: start, lte: end }, role: "USER" },
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: previousStart, lte: previousEnd },
        role: "USER",
      },
    }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.product.groupBy({
      by: ["isActive"],
      _count: { _all: true }, // count every product in the database
    }),
    prisma.product.count({
      where: { isActive: true, stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
    }),
    prisma.product.count({
      where: { isActive: true, stock: { lte: 0 } },
    }),
    prisma.wishlistItem.count(),
    prisma.cart.count({
      where: { items: { some: {} }, updatedAt: { gte: start } },
    }),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.order.count({
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: "REFUNDED",
      },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: "DELIVERED",
      },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: ["SHIPPED", "DELIVERED"] },
      },
    }),
    prisma.user.findMany({
      where: { role: "USER", createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      take: 12,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        total: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.coupon.findMany({
      orderBy: { usageCount: "desc" },
      take: 8,
      select: {
        id: true,
        code: true,
        usageCount: true,
        usageLimit: true,
        discountPercent: true,
        isActive: true,
      },
    }),
    prisma.cart.count({ where: { items: { some: {} } } }),
    prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
    fetchAiMetricsSummary(start, end, previousStart, previousEnd),
    fetchFunnelTrackingSummary(start, end),
  ]);

  const currentRevenue = currentOrders.reduce((sum, o) => sum + o.total, 0);
  const previousRevenue = previousOrders.reduce((sum, o) => sum + o.total, 0);
  const currentOrderCount = currentOrders.length;
  const previousOrderCount = previousOrders.length;

  type LineAgg = {
    name: string;
    category: string;
    revenue: number;
    units: number;
    sellerId: string | null;
  };

  const productAgg = new Map<string, LineAgg>();
  const categoryAgg = new Map<string, LineAgg>();
  const sellerAgg = new Map<string, LineAgg>();

  for (const line of orderLineItems) {
    if (!line.productId) continue; // skip below and jumps to next iteration of the loop
    const lineRevenue = line.price * line.quantity;

    const productRow = productAgg.get(line.productId) ?? {
      name: line.productName,
      category: line.productCategory,
      revenue: 0,
      units: 0,
      sellerId: line.sellerId,
    };
    productRow.revenue += lineRevenue;
    productRow.units += line.quantity;
    productAgg.set(line.productId, productRow);

    const categoryRow = categoryAgg.get(line.productCategory) ?? {
      name: line.productCategory,
      category: line.productCategory,
      revenue: 0,
      units: 0,
      sellerId: null,
    };
    categoryRow.revenue += lineRevenue;
    categoryRow.units += line.quantity;
    categoryAgg.set(line.productCategory, categoryRow);

    if (line.sellerId) {
      const sellerRow = sellerAgg.get(line.sellerId) ?? {
        name: line.sellerId,
        category: "",
        revenue: 0,
        units: 0,
        sellerId: line.sellerId,
      };
      sellerRow.revenue += lineRevenue;
      sellerRow.units += line.quantity;
      sellerAgg.set(line.sellerId, sellerRow);
    }
  }

  const topProductsSorted = Array.from(productAgg.entries())
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const topCategoriesSorted = Array.from(categoryAgg.entries())
    .map(([categoryKey, stats]) => ({
      category: categoryKey,
      revenue: stats.revenue,
      units: stats.units,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const sellerGroupsSorted = Array.from(sellerAgg.entries())
    .map(([sellerId, stats]) => ({
      sellerId,
      revenue: stats.revenue,
      units: stats.units,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const productIds = topProductsSorted.map((row) => row.id);

  const productsById =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, stock: true, images: true },
        })
      : [];

  const stockByProductId = new Map(productsById.map((p) => [p.id, p.stock]));

  const addressIds = geographicGroups.map((g) => g.addressId);
  const addresses =
    addressIds.length > 0
      ? await prisma.address.findMany({
          where: { id: { in: addressIds } },
          select: { id: true, country: true },
        })
      : [];
  const countryByAddressId = new Map(addresses.map((a) => [a.id, a.country]));

  const countryAgg = new Map<string, { orders: number; revenue: number }>();
  for (const row of geographicGroups) {
    const country = countryByAddressId.get(row.addressId) ?? "Unknown";
    const existing = countryAgg.get(country) ?? { orders: 0, revenue: 0 };
    existing.orders += row._count._all;
    existing.revenue += row._sum.total ?? 0;
    countryAgg.set(country, existing);
  }

  const geoTotalRevenue = Array.from(countryAgg.values()).reduce(
    (sum, row) => sum + row.revenue,
    0,
  );

  const geographicSales = Array.from(countryAgg.entries())
    .map(([country, stats]) => ({
      country,
      orders: stats.orders,
      revenue: Number(stats.revenue.toFixed(2)),
      sharePercent:
        geoTotalRevenue > 0
          ? Number(((stats.revenue / geoTotalRevenue) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 12);

  const customerGrowthMap = new Map<string, number>();
  for (const user of allUsersForGrowth) {
    const key = toDateKey(user.createdAt);
    customerGrowthMap.set(key, (customerGrowthMap.get(key) ?? 0) + 1);
  }

  const hourlyMap = new Map<number, number>();
  for (let h = 0; h < 24; h += 1) {
    hourlyMap.set(h, 0);
  }
  for (const order of currentOrders) {
    const hour = order.createdAt.getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + 1);
  }

  const activeProducts =
    productCounts.find((row) => row.isActive === true)?._count._all ?? 0;
  const inactiveProducts =
    productCounts.find((row) => row.isActive === false)?._count._all ?? 0;
  const totalProducts = activeProducts + inactiveProducts;
  const inStock =
    totalProducts - outOfStockCount - lowStockCount > 0
      ? totalProducts - outOfStockCount - lowStockCount
      : 0;

  const completedInPeriod = currentOrderCount;
  const conversionRate =
    cartsWithItems > 0
      ? Number(((completedInPeriod / cartsWithItems) * 100).toFixed(1))
      : 0;
  const cartAbandonmentRate =
    cartsWithItems > 0
      ? Number(
          (
            ((cartsWithItems - completedInPeriod) / cartsWithItems) *
            100
          ).toFixed(1),
        )
      : 0;

  const funnel: FunnelStage[] = [
    {
      stage: "Registered users",
      count: totalUsers,
      rateFromPrevious: 100,
    },
    {
      stage: "Active carts",
      count: cartsWithItems,
      rateFromPrevious:
        totalUsers > 0
          ? Number(((cartsWithItems / totalUsers) * 100).toFixed(1))
          : 0,
    },
    {
      stage: "Checkout started",
      count: totalOrdersAllStatuses,
      rateFromPrevious:
        cartsWithItems > 0
          ? Number(((totalOrdersAllStatuses / cartsWithItems) * 100).toFixed(1))
          : 0,
    },
    {
      stage: "Paid orders",
      count: completedInPeriod,
      rateFromPrevious:
        totalOrdersAllStatuses > 0
          ? Number(
              ((completedInPeriod / totalOrdersAllStatuses) * 100).toFixed(1),
            )
          : 0,
    },
    {
      stage: "Shipped / delivered",
      count: shippedOrDelivered,
      rateFromPrevious:
        completedInPeriod > 0
          ? Number(((shippedOrDelivered / completedInPeriod) * 100).toFixed(1))
          : 0,
    },
  ];

  const sellerIds = sellerGroupsSorted.map((row) => row.sellerId);
  const sellers =
    sellerIds.length > 0
      ? await prisma.seller.findMany({
          where: { id: { in: sellerIds } },
          include: {
            _count: { select: { products: true } },
          },
        })
      : [];
  const sellerNameById = new Map(sellers.map((s) => [s.id, s.name]));
  const sellerProductCountById = new Map(
    sellers.map((s) => [s.id, s._count.products]),
  );

  return {
    period,
    generatedAt: new Date().toISOString(),
    kpis: {
      totalRevenue: Number(currentRevenue.toFixed(2)),
      revenueChangePercent: percentChange(currentRevenue, previousRevenue),
      totalOrders: currentOrderCount,
      ordersChangePercent: percentChange(currentOrderCount, previousOrderCount),
      averageOrderValue:
        currentOrderCount > 0
          ? Number((currentRevenue / currentOrderCount).toFixed(2))
          : 0,
      aovChangePercent: percentChange(
        currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0,
        previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0,
      ),
      totalCustomers: totalUsers,
      newCustomers: newUsersInRange,
      newCustomersChangePercent: percentChange(newUsersInRange, previousNewUsers),
      conversionRate,
      cartAbandonmentRate,
      totalProducts,
      activeProducts,
      lowStockCount,
      outOfStockCount,
      wishlistItems: wishlistCount,
      activeCarts: activeCartCount,
      activeCoupons: activeCouponCount,
      refundRate:
        currentOrderCount > 0
          ? Number(((refundedOrders / currentOrderCount) * 100).toFixed(1))
          : 0,
      fulfillmentRate:
        currentOrderCount > 0
          ? Number(((deliveredOrders / currentOrderCount) * 100).toFixed(1))
          : 0,
    },
    revenueTrend: buildTrendSeries(currentOrders, start, end),
    orderStatusBreakdown: orderStatusGroups.map((row) => ({
      status: row.status,
      count: row._count._all,
      revenue: Number((row._sum.total ?? 0).toFixed(2)),
    })),
    paymentMethodBreakdown: paymentGroups.map((row) => ({
      method: row.paymentMethod,
      count: row._count._all,
      revenue: Number((row._sum.total ?? 0).toFixed(2)),
    })),
    topProducts: topProductsSorted.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      revenue: Number(row.revenue.toFixed(2)),
      unitsSold: row.units,
      stock: stockByProductId.get(row.id) ?? 0,
    })),
    topCategories: topCategoriesSorted.map((row) => {
      const uniqueProducts = new Set(
        orderLineItems
          .filter(
            (line) =>
              line.productCategory === row.category && line.productId != null,
          )
          .map((line) => line.productId as string),
      );
      return {
        category: row.category,
        revenue: Number(row.revenue.toFixed(2)),
        unitsSold: row.units,
        productCount: uniqueProducts.size,
      };
    }),
    geographicSales,
    customerGrowth: Array.from(customerGrowthMap.entries()).map(
      ([date, newUsers]) => ({ date, newUsers }),
    ),
    hourlyOrderDistribution: Array.from(hourlyMap.entries()).map(
      ([hour, orders]) => ({ hour, orders }),
    ),
    conversionFunnel: funnel,
    inventoryHealth: {
      inStock: Math.max(0, inStock),
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
    },
    couponPerformance: coupons,
    recentOrders: recentOrdersRaw.map((order) => ({
      id: order.id,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
      customerName: order.user.name,
      customerEmail: order.user.email,
      itemCount: order._count.items,
    })),
    sellerPerformance: sellerGroupsSorted.map((row) => ({
      id: row.sellerId,
      name: sellerNameById.get(row.sellerId) ?? "Marketplace",
      revenue: Number(row.revenue.toFixed(2)),
      unitsSold: row.units,
      productCount: sellerProductCountById.get(row.sellerId) ?? 0,
    })),
    aiMetrics,
    funnelTracking,
  };
}

export type { AnalyticsPeriod };
