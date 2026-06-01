import { useAnalyticsStore } from "../useAnalyticsStore";

describe("useAnalyticsStore", () => {
  beforeEach(() => {
    useAnalyticsStore.getState().reset();
  });

  it("starts with default period and empty dashboard", () => {
    const state = useAnalyticsStore.getState();
    expect(state.period).toBe("30d");
    expect(state.dashboard).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("setPeriod applies cached dashboard for that period", () => {
    const sample = {
      period: "7d" as const,
      generatedAt: new Date().toISOString(),
      kpis: {} as never,
      revenueTrend: [],
      orderStatusBreakdown: [],
      paymentMethodBreakdown: [],
      topProducts: [],
      topCategories: [],
      geographicSales: [],
      customerGrowth: [],
      hourlyOrderDistribution: [],
      conversionFunnel: [],
      inventoryHealth: { inStock: 0, lowStock: 0, outOfStock: 0 },
      couponPerformance: [],
      recentOrders: [],
      sellerPerformance: [],
      aiMetrics: {
        chatUsageCount: 0,
        chatUsageChangePercent: 0,
        conversionRate: 0,
        convertedChats: 0,
        topIntents: [],
      },
      funnelTracking: {
        chat: 0,
        productView: 0,
        cartAdd: 0,
        orderComplete: 0,
        chatToProductViewRate: 0,
        productViewToCartRate: 0,
        cartToOrderRate: 0,
        overallConversionRate: 0,
        sessionCounts: {
          startedChat: 0,
          reachedProductView: 0,
          reachedCart: 0,
          completedOrder: 0,
        },
      },
    };

    useAnalyticsStore.setState({
      dashboardByPeriod: { "7d": sample },
      fetchedAtByPeriod: { "7d": Date.now() },
    });

    useAnalyticsStore.getState().setPeriod("7d");

    expect(useAnalyticsStore.getState().period).toBe("7d");
    expect(useAnalyticsStore.getState().dashboard).toEqual(sample);
  });

  it("reset clears cache and selection", () => {
    useAnalyticsStore.setState({
      period: "90d",
      dashboard: {} as never,
      dashboardByPeriod: { "90d": {} as never },
    });

    useAnalyticsStore.getState().reset();

    const state = useAnalyticsStore.getState();
    expect(state.period).toBe("30d");
    expect(state.dashboard).toBeNull();
    expect(state.dashboardByPeriod).toEqual({});
  });
});
