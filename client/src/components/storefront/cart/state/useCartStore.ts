import axios from "axios";
import debounce from "lodash/debounce";
import { create } from "zustand";
import { CartItem } from "@/components/storefront/cart/types/cartItemStore";
import { useCartSelectionStore } from "./useCartSelectionStore";

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, "id">) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateCartItemQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CART_FETCH_COOLDOWN_MS = 1500;
let cartFetchInFlight: Promise<void> | null = null;
let lastCartFetchAt = 0;

export const useCartStore = create<CartStore>((set, get) => {
  const debounceUpdateCartItemQuantity = debounce(
    async (id: string, quantity: number) => {
      try {
        await axios.put(
          `/api/cart/update/${id}`,
          { quantity },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (e: any) {
        console.error("❌ Failed to update cart quantity:", e);
        set({ error: "Failed to update cart quantity" });
      }
    },
    500
  );

  return {
    items: [],
    isLoading: false,
    error: null,

    fetchCart: async () => {
      const now = Date.now();
      if (now - lastCartFetchAt < CART_FETCH_COOLDOWN_MS) {
        return;
      }
      if (cartFetchInFlight) {
        return cartFetchInFlight;
      }

      set({ isLoading: true, error: null });
      cartFetchInFlight = (async () => {
        try {
        console.log("🛒 Fetching cart...");

        const response = await axios.get("/api/cart/fetch-cart", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const cartItems = response.data.data?.items || [];

        set({
          items: cartItems,
          isLoading: false,
        });

          console.log("✅ Cart fetched successfully");
          lastCartFetchAt = Date.now();
        } catch (error: any) {
          console.error("❌ Cart fetch failed:", error);

          set({
            error: error.response?.data?.error || "Failed to fetch cart",
            isLoading: false,
            items: [],
          });
        } finally {
          cartFetchInFlight = null;
        }
      })();

      return cartFetchInFlight;
    },

    addToCart: async (item) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post("/api/cart/add-to-cart", item, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        set((state) => ({
          items: [...state.items, response.data.data],
          isLoading: false,
        }));
      } catch (error: any) {
        console.error("❌ Add to cart failed:", error);
        set({
          error: error.response?.data?.error || "Failed to add to cart",
          isLoading: false,
        });
      }
    },

    removeFromCart: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await axios.delete(`/api/cart/remove/${id}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          isLoading: false,
        }));

        useCartSelectionStore
          .getState()
          .pruneInvalidIds(get().items.map((item) => item.id));
      } catch (error: any) {
        console.error("❌ Remove from cart failed:", error);
        set({
          error: error.response?.data?.error || "Failed to delete from cart",
          isLoading: false,
        });
      }
    },

    updateCartItemQuantity: async (id, quantity) => {
      if (quantity < 1) return;

      set((state) => ({
        items: state.items.map((cartItem) =>
          cartItem.id === id ? { ...cartItem, quantity } : cartItem
        ),
      }));

      debounceUpdateCartItemQuantity(id, quantity);
    },

    clearCart: async () => {
      set({ isLoading: true, error: null });
      try {
        await axios.post(
          "/api/cart/clear-cart",
          {},
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        set({ items: [], isLoading: false });
      } catch (error: any) {
        console.error("❌ Clear cart failed:", error);
        set({
          error: error.response?.data?.error || "Failed to clear cart",
          isLoading: false,
        });
      }
    },
  };
});