jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return {
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), isAxiosError: actual.isAxiosError },
  };
});
jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("@/lib/analytics/sessionId", () => ({ getAnalyticsSessionId: () => "sess-1" }));

import axios from "axios";
import { useCartStore } from "../useCartStore";
import { useCartSelectionStore } from "../useCartSelectionStore";
import type { CartItem } from "../../types/cartItemStore";

const http = axios as unknown as { get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock };

function item(id: string, quantity = 1): CartItem {
  return { id, productId: `prod-${id}`, name: `Item ${id}`, price: 10, image: "", quantity };
}

// Shape axios.isAxiosError() recognises; avoids depending on the mocked module's classes.
function axiosError(status: number, data: unknown): Error {
  return Object.assign(new Error("Request failed"), { isAxiosError: true, response: { status, data } });
}

let clock = 1_000_000;

describe("useCartStore", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
    // Move well past the fetch cooldown left by the previous test.
    clock += 60_000;
    jest.setSystemTime(clock);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    useCartStore.setState({ items: [], isLoading: false, error: null });
    useCartSelectionStore.setState({ selectedIds: [] });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("fetches cart items", async () => {
    http.get.mockResolvedValue({ data: { data: { items: [item("a")] } } });
    await useCartStore.getState().fetchCart();
    expect(useCartStore.getState()).toMatchObject({ items: [item("a")], isLoading: false, error: null });
  });

  it("deduplicates concurrent fetches and honours the cooldown", async () => {
    http.get.mockResolvedValue({ data: { data: { items: [] } } });
    await Promise.all([useCartStore.getState().fetchCart(), useCartStore.getState().fetchCart()]);
    await useCartStore.getState().fetchCart();
    expect(http.get).toHaveBeenCalledTimes(1);

    jest.setSystemTime(clock + 2_000);
    await useCartStore.getState().fetchCart();
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it("clears items and surfaces the server error on fetch failure", async () => {
    useCartStore.setState({ items: [item("stale")] });
    http.get.mockRejectedValue(axiosError(401, { error: "Unauthorized" }));
    await useCartStore.getState().fetchCart();
    expect(useCartStore.getState()).toMatchObject({ items: [], error: "Unauthorized", isLoading: false });
  });

  it("appends a new line and sends the analytics session id", async () => {
    http.post.mockResolvedValue({ data: { data: item("b") } });
    useCartStore.setState({ items: [item("a")] });
    await useCartStore.getState().addToCart({ productId: "prod-b", name: "B", price: 10, image: "", quantity: 1 });
    expect(useCartStore.getState().items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(http.post.mock.calls[0][1]).toMatchObject({ productId: "prod-b", sessionId: "sess-1" });
  });

  it("merges a repeat add into the existing line instead of duplicating it", async () => {
    useCartStore.setState({ items: [item("a", 1), item("b", 1)] });
    http.post.mockResolvedValue({ data: { data: item("a", 3) } });
    await useCartStore.getState().addToCart({ productId: "prod-a", name: "A", price: 10, image: "", quantity: 2 });
    expect(useCartStore.getState().items).toEqual([item("a", 3), item("b", 1)]);
  });

  it("uses a fallback message for non-HTTP add failures", async () => {
    http.post.mockRejectedValue(new Error("Network Error"));
    await useCartStore.getState().addToCart({ productId: "p", name: "n", price: 1, image: "", quantity: 1 });
    expect(useCartStore.getState().error).toBe("Failed to add to cart");
  });

  it("removes a line and prunes it from the checkout selection", async () => {
    useCartStore.setState({ items: [item("a"), item("b")] });
    useCartSelectionStore.setState({ selectedIds: ["a", "b"] });
    http.delete.mockResolvedValue({ data: { success: true } });
    await useCartStore.getState().removeFromCart("a");
    expect(useCartStore.getState().items.map((i) => i.id)).toEqual(["b"]);
    expect(useCartSelectionStore.getState().selectedIds).toEqual(["b"]);
  });

  it("keeps the line when removal fails", async () => {
    useCartStore.setState({ items: [item("a")] });
    http.delete.mockRejectedValue(axiosError(404, { error: "Cart item not found" }));
    await useCartStore.getState().removeFromCart("a");
    expect(useCartStore.getState()).toMatchObject({ items: [item("a")], error: "Cart item not found" });
  });

  it("updates quantity optimistically and debounces the server write", async () => {
    useCartStore.setState({ items: [item("a", 1)] });
    http.put.mockResolvedValue({ data: {} });
    await useCartStore.getState().updateCartItemQuantity("a", 2);
    await useCartStore.getState().updateCartItemQuantity("a", 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(http.put).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(http.put).toHaveBeenCalledTimes(1);
    expect(http.put.mock.calls[0].slice(0, 2)).toEqual(["/api/cart/update/a", { quantity: 3 }]);
  });

  it("ignores quantities below 1", async () => {
    useCartStore.setState({ items: [item("a", 2)] });
    await useCartStore.getState().updateCartItemQuantity("a", 0);
    jest.advanceTimersByTime(1000);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(http.put).not.toHaveBeenCalled();
  });

  it("clears the cart only after the server confirms", async () => {
    useCartStore.setState({ items: [item("a")] });
    http.post.mockRejectedValueOnce(axiosError(500, {}));
    await useCartStore.getState().clearCart();
    expect(useCartStore.getState()).toMatchObject({ items: [item("a")], error: "Failed to clear cart" });

    http.post.mockResolvedValueOnce({ data: { success: true } });
    await useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual([]);
  });
});

describe("useCartSelectionStore", () => {
  beforeEach(() => useCartSelectionStore.setState({ selectedIds: [] }));

  it("toggles, de-duplicates, prunes and clears selections", () => {
    const store = useCartSelectionStore.getState();
    store.toggleItem("a");
    store.toggleItem("b");
    store.toggleItem("a");
    expect(useCartSelectionStore.getState().selectedIds).toEqual(["b"]);

    store.selectAll(["a", "b", "a", "c"]);
    expect(useCartSelectionStore.getState().selectedIds).toEqual(["a", "b", "c"]);
    expect(useCartSelectionStore.getState().isSelected("c")).toBe(true);

    store.pruneInvalidIds(["a", "c", "z"]);
    expect(useCartSelectionStore.getState().selectedIds).toEqual(["a", "c"]);

    store.setSelectedIds(["x", "x"]);
    expect(useCartSelectionStore.getState().selectedIds).toEqual(["x"]);

    store.clearSelection();
    expect(useCartSelectionStore.getState().selectedIds).toEqual([]);
  });
});
