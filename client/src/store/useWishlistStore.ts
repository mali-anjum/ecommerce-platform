import axios from "axios";
import { create } from "zustand";
import type {
  ToggleWishlistResponse,
  WishlistItem,
  WishlistProductSnapshot,
  WishlistResponse,
} from "@/types/wishlist/wishlistTypes";

interface WishlistStore {
  items: WishlistItem[];
  productIds: Set<string>;
  isLoading: boolean;
  isToggling: Record<string, boolean>;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (
    productId: string,
    snapshot?: WishlistProductSnapshot
  ) => Promise<ToggleWishlistResponse | null>;
  removeFromWishlist: (wishlistItemId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WISHLIST_FETCH_COOLDOWN_MS = 1500;
let wishlistFetchInFlight: Promise<void> | null = null;
let lastWishlistFetchAt = 0;

function buildOptimisticItem(
  productId: string,
  snapshot: WishlistProductSnapshot
): WishlistItem {
  const now = new Date().toISOString();
  return {
    id: `optimistic-${productId}`,
    productId,
    name: snapshot.name,
    brand: snapshot.brand ?? "",
    category: snapshot.category,
    thumbnail: snapshot.thumbnail ?? null,
    price: snapshot.price,
    salePrice: snapshot.salePrice ?? null,
    discountPercent: snapshot.discountPercent ?? null,
    stock: snapshot.stock ?? 0,
    availability: snapshot.availability ?? "available",
    isPurchasable: snapshot.availability === "available",
    sizes: snapshot.sizes ?? [],
    colors: snapshot.colors ?? [],
    addedAt: now,
  };
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  productIds: new Set<string>(),
  isLoading: false,
  isToggling: {},
  error: null,

  fetchWishlist: async () => {
    const now = Date.now();
    if (now - lastWishlistFetchAt < WISHLIST_FETCH_COOLDOWN_MS) {
      return;
    }
    if (wishlistFetchInFlight) {
      return wishlistFetchInFlight;
    }

    set({ isLoading: true, error: null });
    wishlistFetchInFlight = (async () => {
      try {
        const response = await axios.get<{ data: WishlistResponse }>(
          "/api/wishlist",
          { headers: { "Content-Type": "application/json" } }
        );
        const payload = response.data.data;
        const items = payload?.items ?? [];

        set({
          items,
          productIds: new Set(items.map((item) => item.productId)),
          isLoading: false,
        });
        lastWishlistFetchAt = Date.now();
      } catch (error: unknown) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? String(error.response.data.error)
            : "Failed to fetch wishlist";

        set({
          error: message,
          isLoading: false,
          items: [],
          productIds: new Set(),
        });
      } finally {
        wishlistFetchInFlight = null;
      }
    })();

    return wishlistFetchInFlight;
  },

  toggleWishlist: async (productId, snapshot) => {
    const previousItems = get().items;
    const previousIds = new Set(get().productIds);
    const wasInWishlist = previousIds.has(productId);

    set((state) => ({
      isToggling: { ...state.isToggling, [productId]: true },
      error: null,
    }));

    if (wasInWishlist) { // already in wishlist, remove item from it
      set({
        items: previousItems.filter((item) => item.productId !== productId),
        productIds: new Set(
          [...previousIds].filter((id) => id !== productId)
        ),
      });
    } else if (snapshot) { // not in wishlist, add item to it
      const optimistic = buildOptimisticItem(productId, snapshot);
      set({
        items: [optimistic, ...previousItems],
        productIds: new Set([...previousIds, productId]),
      });
    }

    try {
      const response = await axios.post<{ data: ToggleWishlistResponse }>(
        "/api/wishlist/toggle",
        { productId },
        { headers: { "Content-Type": "application/json" } }
      );

      const result = response.data.data;

      if (result.action === "added" && result.item) {
        set((state) => ({ // update wishlist with new item
          items: [
            result.item!,
            ...state.items.filter(
              (item) =>
                item.productId !== productId && !item.id.startsWith("optimistic-")
            ),
          ],
          productIds: new Set([...state.productIds, productId]),
        }));
      } else if (result.action === "removed") {
        set((state) => ({ // update wishlist without item
          items: state.items.filter((item) => item.productId !== productId),
          productIds: new Set(
            [...state.productIds].filter((id) => id !== productId)
          ),
        }));
      }

      return result;
    } catch (error: unknown) {
      set({
        items: previousItems,
        productIds: previousIds,
        error:
          axios.isAxiosError(error) && error.response?.data?.error
            ? String(error.response.data.error)
            : "Failed to update wishlist",
      });
      return null;
    } finally {
      set((state) => {
        const next = { ...state.isToggling };
        delete next[productId];
        return { isToggling: next };
      });
    }
  },

  removeFromWishlist: async (wishlistItemId) => {
    const previousItems = get().items;
    const target = previousItems.find((item) => item.id === wishlistItemId);
    const previousIds = new Set(get().productIds);

    set({
      items: previousItems.filter((item) => item.id !== wishlistItemId),
      productIds: target
        ? new Set([...previousIds].filter((id) => id !== target.productId))
        : previousIds,
      error: null,
    });

    try {
      await axios.delete(`/api/wishlist/remove/${wishlistItemId}`, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      set({
        items: previousItems,
        productIds: previousIds,
        error:
          axios.isAxiosError(error) && error.response?.data?.error
            ? String(error.response.data.error)
            : "Failed to remove from wishlist",
      });
    }
  },

  isInWishlist: (productId) => get().productIds.has(productId),

  clearWishlist: () => {
    set({ items: [], productIds: new Set(), error: null });
  },
}));
