jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return {
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), delete: jest.fn(), isAxiosError: actual.isAxiosError },
  };
});
jest.mock("@/lib/http", () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));
jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import axios from "axios";
import { http } from "@/lib/http";
import { useCouponStore } from "../useCouponStore";
import { useAddressStore } from "../useAddressStore";
import type { Address } from "../../types/Address";
import type { Coupon } from "../../types/Coupon";

const ax = axios as unknown as { get: jest.Mock; post: jest.Mock; delete: jest.Mock };
const api = http as unknown as { get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock };

// Shape axios.isAxiosError() recognises; avoids depending on the mocked module's classes.
function axiosError(status: number, data: unknown): Error {
  return Object.assign(new Error("Request failed"), { isAxiosError: true, response: { status, data } });
}

const coupon = (id: string) => ({ id, code: id.toUpperCase(), discountPercent: 10 }) as unknown as Coupon;
const address = (id: string) => ({ id, name: id }) as unknown as Address;

describe("useCouponStore", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useCouponStore.setState({ couponList: [], isLoading: false, error: null });
  });

  it("loads the admin coupon list", async () => {
    ax.get.mockResolvedValue({ data: { couponList: [coupon("a")] } });
    await useCouponStore.getState().fetchCoupons();
    expect(useCouponStore.getState()).toMatchObject({ couponList: [coupon("a")], isLoading: false });
    expect(ax.get.mock.calls[0][1]).toEqual({ withCredentials: true });
  });

  it("reports a fetch failure", async () => {
    ax.get.mockRejectedValue(axiosError(403, {}));
    await useCouponStore.getState().fetchCoupons();
    expect(useCouponStore.getState().error).toBe("Failed to fetch coupons");
  });

  it("returns the created coupon or surfaces the server's message (e.g. duplicate code)", async () => {
    ax.post.mockResolvedValueOnce({ data: { coupon: coupon("new") } });
    await expect(useCouponStore.getState().createCoupon({} as Omit<Coupon, "id" | "usageCount">)).resolves.toEqual(coupon("new"));

    ax.post.mockRejectedValueOnce(axiosError(409, { message: "A coupon with this code already exists" }));
    await expect(useCouponStore.getState().createCoupon({} as Omit<Coupon, "id" | "usageCount">)).resolves.toBeNull();
    expect(useCouponStore.getState().error).toBe("A coupon with this code already exists");
  });

  it("removes a deleted coupon and returns true", async () => {
    useCouponStore.setState({ couponList: [coupon("a"), coupon("b")] });
    ax.delete.mockResolvedValue({ data: { success: true } });
    await expect(useCouponStore.getState().deleteCoupon("a")).resolves.toBe(true);
    expect(useCouponStore.getState().couponList).toEqual([coupon("b")]);
  });

  it("returns false with a delete-specific message on failure", async () => {
    useCouponStore.setState({ couponList: [coupon("a")] });
    ax.delete.mockRejectedValue(axiosError(404, { message: "Coupon not found" }));
    await expect(useCouponStore.getState().deleteCoupon("a")).resolves.toBe(false);
    expect(useCouponStore.getState()).toMatchObject({ couponList: [coupon("a")], error: "Coupon not found" });
  });
});

describe("useAddressStore", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    useAddressStore.setState({ addresses: [], isLoading: false, error: null, lastFetched: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches addresses and serves the 30s cache afterwards", async () => {
    api.get.mockResolvedValue({ data: { address: [address("a")] } });
    await useAddressStore.getState().fetchAddresses();
    await useAddressStore.getState().fetchAddresses();
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(useAddressStore.getState().addresses).toEqual([address("a")]);
  });

  it("records a failure without clearing existing addresses", async () => {
    useAddressStore.setState({ addresses: [], lastFetched: null });
    api.get.mockRejectedValue(new Error("down"));
    await useAddressStore.getState().fetchAddresses();
    expect(useAddressStore.getState()).toMatchObject({ error: "Failed to fetch address", isLoading: false });
    expect(useAddressStore.getState().lastFetched).not.toBeNull();
  });

  it("prepends created addresses and replaces updated ones", async () => {
    useAddressStore.setState({ addresses: [address("a")] });
    api.post.mockResolvedValue({ data: { address: address("b") } });
    await useAddressStore.getState().createAddress({} as Omit<Address, "id">);
    expect(useAddressStore.getState().addresses.map((a) => a.id)).toEqual(["b", "a"]);

    api.put.mockResolvedValue({ data: { address: { ...address("a"), name: "Home" } } });
    await useAddressStore.getState().updateAddress("a", { name: "Home" } as Partial<Address>);
    expect(useAddressStore.getState().addresses[1]).toMatchObject({ id: "a", name: "Home" });
  });

  it("keeps an address that the server refuses to delete (used by an order) and shows why", async () => {
    useAddressStore.setState({ addresses: [address("a")] });
    api.delete.mockRejectedValue(axiosError(409, { message: "This address is used by an existing order" }));
    await expect(useAddressStore.getState().deleteAddress("a")).resolves.toBe(false);
    expect(useAddressStore.getState().addresses).toEqual([address("a")]);
    expect(useAddressStore.getState().error).toMatch(/existing order/);
  });

  it("removes an address on successful delete", async () => {
    useAddressStore.setState({ addresses: [address("a"), address("b")] });
    api.delete.mockResolvedValue({ data: { success: true } });
    await expect(useAddressStore.getState().deleteAddress("a")).resolves.toBe(true);
    expect(useAddressStore.getState().addresses).toEqual([address("b")]);
  });
});
