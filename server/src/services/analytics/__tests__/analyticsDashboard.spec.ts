jest.mock("../../../lib/prisma", () => ({
  prisma: {
    order: { findMany: jest.fn(), groupBy: jest.fn(), count: jest.fn() },
    orderItem: { findMany: jest.fn() },
    user: { count: jest.fn(), findMany: jest.fn() },
    product: { groupBy: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    wishlistItem: { count: jest.fn() },
    cart: { count: jest.fn() },
    coupon: { count: jest.fn(), findMany: jest.fn() },
    address: { findMany: jest.fn() },
    seller: { findMany: jest.fn() },
  },
}));
jest.mock("../../ai/analytics/AiAnalyticsService", () => ({ fetchAiMetricsSummary: jest.fn() }));
jest.mock("../funnelAnalyticsService", () => ({ fetchFunnelTrackingSummary: jest.fn() }));

import { prisma } from "../../../lib/prisma";
import { fetchAnalyticsDashboard } from "../analyticsService";
import { parseAnalyticsPeriod } from "../period";
import { fetchAiMetricsSummary } from "../../ai/analytics/AiAnalyticsService";
import { fetchFunnelTrackingSummary } from "../funnelAnalyticsService";

type Where = Record<string, unknown> | undefined;
const db = prisma as unknown as {
  order: { findMany: jest.Mock; groupBy: jest.Mock; count: jest.Mock };
  orderItem: { findMany: jest.Mock };
  user: { count: jest.Mock; findMany: jest.Mock };
  product: { groupBy: jest.Mock; count: jest.Mock; findMany: jest.Mock };
  wishlistItem: { count: jest.Mock };
  cart: { count: jest.Mock };
  coupon: { count: jest.Mock; findMany: jest.Mock };
  address: { findMany: jest.Mock };
  seller: { findMany: jest.Mock };
};

const NOW = new Date("2026-03-15T12:00:00Z");
const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

function seedEmptyStore() {
  db.order.findMany.mockResolvedValue([]);
  db.order.groupBy.mockResolvedValue([]);
  db.order.count.mockResolvedValue(0);
  db.orderItem.findMany.mockResolvedValue([]);
  db.user.count.mockResolvedValue(0);
  db.user.findMany.mockResolvedValue([]);
  db.product.groupBy.mockResolvedValue([]);
  db.product.count.mockResolvedValue(0);
  db.product.findMany.mockResolvedValue([]);
  db.wishlistItem.count.mockResolvedValue(0);
  db.cart.count.mockResolvedValue(0);
  db.coupon.count.mockResolvedValue(0);
  db.coupon.findMany.mockResolvedValue([]);
  db.address.findMany.mockResolvedValue([]);
  db.seller.findMany.mockResolvedValue([]);
  (fetchAiMetricsSummary as jest.Mock).mockResolvedValue({ ai: true });
  (fetchFunnelTrackingSummary as jest.Mock).mockResolvedValue({ funnel: true });
}

describe("fetchAnalyticsDashboard", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now: NOW, doNotFake: ["setImmediate", "nextTick"] });
    seedEmptyStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns zeroed KPIs (no NaN / divide-by-zero) for an empty store", async () => {
    const result = await fetchAnalyticsDashboard("7d");

    expect(result.period).toBe("7d");
    expect(result.kpis).toMatchObject({
      totalRevenue: 0,
      revenueChangePercent: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      cartAbandonmentRate: 0,
      refundRate: 0,
      fulfillmentRate: 0,
      totalProducts: 0,
    });
    expect(JSON.stringify(result)).not.toContain("NaN");
    expect(result.revenueTrend.length).toBeGreaterThanOrEqual(7);
    expect(result.hourlyOrderDistribution).toHaveLength(24);
    expect(result.conversionFunnel.map((s) => s.rateFromPrevious)).toEqual([100, 0, 0, 0, 0]);
    expect(result.aiMetrics).toEqual({ ai: true });
    expect(result.funnelTracking).toEqual({ funnel: true });
    // No follow-up lookups when there is nothing to enrich.
    expect(db.product.findMany).not.toHaveBeenCalled();
    expect(db.address.findMany).not.toHaveBeenCalled();
    expect(db.seller.findMany).not.toHaveBeenCalled();
  });

  it("only counts paid orders as revenue", async () => {
    await fetchAnalyticsDashboard("30d");
    const currentWhere = db.order.findMany.mock.calls[0][0].where as Where;
    expect(currentWhere).toMatchObject({ paymentStatus: "COMPLETED" });
    expect(db.orderItem.findMany.mock.calls[0][0].where.order).toMatchObject({ paymentStatus: "COMPLETED" });
  });

  it("falls back to 30d for unknown and prototype-key periods", async () => {
    expect(parseAnalyticsPeriod("constructor")).toBe("30d");
    expect(parseAnalyticsPeriod("toString")).toBe("30d");
    const result = await fetchAnalyticsDashboard("__proto__");
    expect(result.period).toBe("30d");
  });

  it("aggregates revenue, products, categories, sellers, geography and growth", async () => {
    db.order.findMany.mockImplementation((args: { where?: Where; take?: number; select: Record<string, unknown> }) => {
      if (args.take === 12) {
        return Promise.resolve([
          {
            id: "o1",
            total: 300,
            status: "DELIVERED",
            paymentStatus: "COMPLETED",
            paymentMethod: "STRIPE",
            createdAt: day("2026-03-14"),
            user: { name: "Ann", email: "ann@x.io" },
            _count: { items: 2 },
          },
        ]);
      }
      if (args.select.paymentMethod) {
        return Promise.resolve([
          { id: "o1", total: 300, createdAt: day("2026-03-14"), paymentMethod: "STRIPE" },
          { id: "o2", total: 100, createdAt: day("2026-03-14"), paymentMethod: "PAYPAL" },
        ]);
      }
      return Promise.resolve([{ total: 200 }]); // previous period
    });
    db.orderItem.findMany.mockResolvedValue([
      { productId: "p1", productName: "Laptop", productCategory: "Laptops", quantity: 1, price: 250, sellerId: "s1" },
      { productId: "p2", productName: "Mouse", productCategory: "Accessories", quantity: 5, price: 10, sellerId: null },
      { productId: "p1", productName: "Laptop", productCategory: "Laptops", quantity: 1, price: 100, sellerId: "s1" },
    ]);
    db.order.groupBy.mockImplementation((args: { by: string[] }) => {
      if (args.by[0] === "addressId") {
        return Promise.resolve([
          { addressId: "a1", _count: { _all: 1 }, _sum: { total: 300 } },
          { addressId: "a2", _count: { _all: 1 }, _sum: { total: 100 } },
          { addressId: "gone", _count: { _all: 1 }, _sum: { total: null } },
        ]);
      }
      if (args.by[0] === "status") {
        return Promise.resolve([{ status: "DELIVERED", _count: { _all: 2 }, _sum: { total: 400 } }]);
      }
      return Promise.resolve([{ paymentMethod: "STRIPE", _count: { _all: 1 }, _sum: { total: null } }]);
    });
    db.address.findMany.mockResolvedValue([
      { id: "a1", country: "PK" },
      { id: "a2", country: "US" },
    ]);
    db.product.findMany.mockResolvedValue([{ id: "p1", stock: 3, images: [] }]);
    db.seller.findMany.mockResolvedValue([{ id: "s1", name: "Acme", _count: { products: 4 } }]);
    db.product.groupBy.mockResolvedValue([
      { isActive: true, _count: { _all: 8 } },
      { isActive: false, _count: { _all: 2 } },
    ]);
    db.product.count.mockImplementation((args: { where: { stock: { lte: number; gt?: number } } }) =>
      Promise.resolve(args.where.stock.gt !== undefined ? 3 : 1)
    );
    db.cart.count.mockResolvedValue(4);
    db.user.count.mockResolvedValue(10);
    db.user.findMany.mockResolvedValue([{ createdAt: day("2026-03-01") }, { createdAt: day("2026-03-01") }]);

    const result = await fetchAnalyticsDashboard("30d");

    expect(result.kpis).toMatchObject({
      totalRevenue: 400,
      revenueChangePercent: 100,
      totalOrders: 2,
      ordersChangePercent: 100,
      averageOrderValue: 200,
      totalProducts: 10,
      activeProducts: 8,
      lowStockCount: 3,
      outOfStockCount: 1,
      conversionRate: 50,
      cartAbandonmentRate: 50,
    });
    expect(result.inventoryHealth).toEqual({ inStock: 6, lowStock: 3, outOfStock: 1 });

    expect(result.topProducts).toEqual([
      { id: "p1", name: "Laptop", category: "Laptops", revenue: 350, unitsSold: 2, stock: 3 },
      { id: "p2", name: "Mouse", category: "Accessories", revenue: 50, unitsSold: 5, stock: 0 },
    ]);
    expect(result.topCategories[0]).toEqual({ category: "Laptops", revenue: 350, unitsSold: 2, productCount: 1 });
    expect(result.sellerPerformance).toEqual([{ id: "s1", name: "Acme", revenue: 350, unitsSold: 2, productCount: 4 }]);

    expect(result.geographicSales).toEqual([
      { country: "PK", orders: 1, revenue: 300, sharePercent: 75 },
      { country: "US", orders: 1, revenue: 100, sharePercent: 25 },
      { country: "Unknown", orders: 1, revenue: 0, sharePercent: 0 },
    ]);
    expect(result.paymentMethodBreakdown).toEqual([{ method: "STRIPE", count: 1, revenue: 0 }]);
    expect(result.customerGrowth).toEqual([{ date: "2026-03-01", newUsers: 2 }]);
    expect(result.recentOrders[0]).toMatchObject({ id: "o1", customerEmail: "ann@x.io", itemCount: 2 });

    const trendTotal = result.revenueTrend.reduce((sum, p) => sum + p.revenue, 0);
    expect(trendTotal).toBe(400);
    expect(result.hourlyOrderDistribution.reduce((sum, h) => sum + h.orders, 0)).toBe(2);
  });
});
