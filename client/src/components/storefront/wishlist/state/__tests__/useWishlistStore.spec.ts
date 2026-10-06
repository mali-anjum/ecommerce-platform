jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return { __esModule: true, default: { get: jest.fn(), post: jest.fn(), delete: jest.fn(), isAxiosError: actual.isAxiosError } };
});
jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import axios from "axios";
import { useWishlistStore } from "../useWishlistStore";
import type { WishlistItem, WishlistProductSnapshot } from "../../types/wishlistTypes";

const http = axios as unknown as { get: jest.Mock; post: jest.Mock; delete: jest.Mock };

const snapshot = (name: string): WishlistProductSnapshot =>
  ({ productId: name, name, brand: "B", category: "C", thumbnail: null, price: 10, salePrice: null, discountPercent: null, stock: 1, availability: "available", sizes: [], colors: [] }) as WishlistProductSnapshot;
const item = (productId: string, id = `w-${productId}`) => ({ id, productId, name: productId }) as unknown as WishlistItem;
const axiosError = (status: number, data: unknown) => Object.assign(new Error("HTTP"), { isAxiosError: true, response: { status, data } });

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

let clock = 5_000_000;

describe("useWishlistStore", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
    clock += 60_000;
    jest.setSystemTime(clock);
    useWishlistStore.getState().clearWishlist();
    useWishlistStore.setState({ isToggling: {}, isLoading: false });
  });

  afterEach(() => jest.useRealTimers());

  it("fetches items, indexes product ids and de-duplicates rapid fetches", async () => {
    http.get.mockResolvedValue({ data: { data: { items: [item("p1")] } } });
    await Promise.all([useWishlistStore.getState().fetchWishlist(), useWishlistStore.getState().fetchWishlist()]);
    await useWishlistStore.getState().fetchWishlist();
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(useWishlistStore.getState().isInWishlist("p1")).toBe(true);
  });

  it("refetches immediately after clearWishlist (account switch)", async () => {
    http.get.mockResolvedValueOnce({ data: { data: { items: [item("old")] } } });
    await useWishlistStore.getState().fetchWishlist();
    useWishlistStore.getState().clearWishlist();
    http.get.mockResolvedValueOnce({ data: { data: { items: [item("new")] } } });
    await useWishlistStore.getState().fetchWishlist();
    expect(useWishlistStore.getState().items.map((i) => i.productId)).toEqual(["new"]);
  });

  it("adds optimistically and replaces the placeholder with the server item", async () => {
    const pending = deferred<unknown>();
    http.post.mockReturnValue(pending.promise);
    const toggle = useWishlistStore.getState().toggleWishlist("p1", snapshot("p1"));
    expect(useWishlistStore.getState().items[0].id).toBe("optimistic-p1");
    expect(useWishlistStore.getState().isToggling.p1).toBe(true);

    pending.resolve({ data: { data: { action: "added", item: item("p1", "w-real") } } });
    await toggle;
    expect(useWishlistStore.getState().items.map((i) => i.id)).toEqual(["w-real"]);
    expect(useWishlistStore.getState().isToggling.p1).toBeUndefined();
  });

  it("keeps another product's optimistic row while a concurrent toggle resolves", async () => {
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    http.post.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const a = useWishlistStore.getState().toggleWishlist("a", snapshot("a"));
    const b = useWishlistStore.getState().toggleWishlist("b", snapshot("b"));
    first.resolve({ data: { data: { action: "added", item: item("a") } } });
    await a;

    const ids = useWishlistStore.getState().items.map((i) => i.productId).sort();
    expect(ids).toEqual(["a", "b"]);
    expect(useWishlistStore.getState().isInWishlist("b")).toBe(true);

    second.resolve({ data: { data: { action: "added", item: item("b") } } });
    await b;
    expect(useWishlistStore.getState().items.map((i) => i.id).sort()).toEqual(["w-a", "w-b"]);
  });

  it("removes optimistically and rolls back on failure", async () => {
    useWishlistStore.setState({ items: [item("p1")], productIds: new Set(["p1"]) });
    http.post.mockRejectedValue(axiosError(500, { error: "DB down" }));
    await expect(useWishlistStore.getState().toggleWishlist("p1")).resolves.toBeNull();
    expect(useWishlistStore.getState().items).toEqual([item("p1")]);
    expect(useWishlistStore.getState().error).toBe("DB down");
  });

  it("removeFromWishlist restores the item when the server rejects", async () => {
    useWishlistStore.setState({ items: [item("p1")], productIds: new Set(["p1"]) });
    http.delete.mockRejectedValue(new Error("offline"));
    await useWishlistStore.getState().removeFromWishlist("w-p1");
    expect(useWishlistStore.getState().isInWishlist("p1")).toBe(true);
    expect(useWishlistStore.getState().error).toBe("Failed to remove from wishlist");

    http.delete.mockResolvedValue({});
    await useWishlistStore.getState().removeFromWishlist("w-p1");
    expect(useWishlistStore.getState().isInWishlist("p1")).toBe(false);
  });
});
