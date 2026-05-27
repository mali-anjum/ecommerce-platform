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
