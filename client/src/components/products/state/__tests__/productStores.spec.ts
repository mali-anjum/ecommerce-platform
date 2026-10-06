jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));
jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import axios from "axios";
import { useProductStore } from "../useProductStore";
import { useCategoryStore } from "../useCategoryStore";

const http = axios as unknown as Record<"get" | "post" | "put" | "delete", jest.Mock>;
const httpError = (status: number, data: unknown) => Object.assign(new Error("HTTP"), { response: { status, data } });

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe("useProductStore", () => {
  beforeEach(() => useProductStore.setState({ products: [], error: null, isLoading: false, currentPage: 1, totalPages: 1, totalProducts: 0 }));

  it("serializes array filters and drops empty/default ones for the client listing", async () => {
    http.get.mockResolvedValue({ data: { data: { products: [{ id: "p1" }], currentPage: 2, totalPages: 5, totalProducts: 41 } } });
    await useProductStore.getState().fetchProductsForClient({
      page: 2,
      limit: 12,
      categories: ["Laptops", "Phones"],
      brands: [],
      onDeal: false,
      search: "",
      collection: "all",
      minDiscount: 0,
    } as never);

    const params = http.get.mock.calls[0][1].params;
    expect(params).toMatchObject({ page: 2, limit: 12, categories: "Laptops,Phones", brands: "" });
    expect(params.onDeal).toBeUndefined();
    expect(params.search).toBeUndefined();
    expect(params.collection).toBeUndefined();
    expect(params.minDiscount).toBeUndefined();
    expect(useProductStore.getState()).toMatchObject({ products: [{ id: "p1" }], currentPage: 2, totalPages: 5, totalProducts: 41 });
  });

  it("passes active deal/collection filters through", async () => {
    http.get.mockResolvedValue({ data: { products: [] } });
    await useProductStore.getState().fetchProductsForClient({ onDeal: true, collection: "new-arrivals", minDiscount: 20 } as never);
    expect(http.get.mock.calls[0][1].params).toMatchObject({ onDeal: "true", collection: "new-arrivals", minDiscount: 20 });
    expect(useProductStore.getState()).toMatchObject({ currentPage: 1, totalPages: 1, totalProducts: 0 });
  });

  it("clears products and shows the server message on listing failure", async () => {
    useProductStore.setState({ products: [{ id: "stale" }] as never });
    http.get.mockRejectedValue(httpError(400, { message: "limit must be <= 100" }));
    await useProductStore.getState().fetchProductsForClient({} as never);
    expect(useProductStore.getState()).toMatchObject({ products: [], error: "limit must be <= 100" });
  });

  it.each([
    [{ data: { data: { items: [{ id: "a" }] } } }, [{ id: "a" }]],
    [{ data: { items: [{ id: "b" }] } }, [{ id: "b" }]],
    [{ data: {} }, []],
  ])("reads admin products from %p", async (response, expected) => {
    http.get.mockResolvedValue(response);
    await useProductStore.getState().fetchAllProductsForAdmin();
    expect(useProductStore.getState().products).toEqual(expected);
  });

  it("surfaces server validation on update (e.g. negative price)", async () => {
    http.put.mockRejectedValue(httpError(400, { message: "price must be a non-negative number" }));
    await expect(useProductStore.getState().updateProduct("p1", new FormData())).rejects.toThrow("HTTP");
    expect(useProductStore.getState()).toMatchObject({ isLoading: false, error: "price must be a non-negative number" });
  });
});

describe("useCategoryStore", () => {
  beforeEach(() => useCategoryStore.setState({ categories: [], lastFetchedAt: null, pendingRequest: null, error: null }));

  it("caches categories and shares an in-flight request", async () => {
    http.get.mockResolvedValue({ data: { data: [{ name: "Laptops", count: 3 }] } });
    await Promise.all([useCategoryStore.getState().fetchCategories(), useCategoryStore.getState().fetchCategories()]);
    await useCategoryStore.getState().fetchCategories();
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(useCategoryStore.getState().categories).toEqual([{ name: "Laptops", count: 3 }]);

    await useCategoryStore.getState().fetchCategories(true);
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it("normalizes non-array payloads to an empty list", async () => {
    http.get.mockResolvedValue({ data: { data: { unexpected: true } } });
    await useCategoryStore.getState().fetchCategories(true);
    expect(useCategoryStore.getState().categories).toEqual([]);
  });

  it("keeps existing categories when a refresh fails", async () => {
    useCategoryStore.setState({ categories: [{ name: "Laptops" }] as never });
    http.get.mockRejectedValue(httpError(500, {}));
    await useCategoryStore.getState().fetchCategories(true);
    expect(useCategoryStore.getState()).toMatchObject({ categories: [{ name: "Laptops" }], error: "Failed to fetch categories", pendingRequest: null });
  });
});
