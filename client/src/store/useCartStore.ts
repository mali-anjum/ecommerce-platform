// import { API_ROUTES } from "@/utils/api";
// import axios from "axios";
// import debounce from "lodash/debounce";
// import { create } from "zustand";
// import { CartItem } from "@/types/cart/cartItemStore";
// interface CartStore {
//   items: CartItem[];
//   isLoading: boolean;
//   error: string | null;
//   fetchCart: () => Promise<void>;
//   addToCart: (item: Omit<CartItem, "id">) => Promise<void>;
//   removeFromCart: (id: string) => Promise<void>;
//   updateCartItemQuantity: (id: string, quantity: number) => Promise<void>;
//   clearCart: () => Promise<void>;
// }

// export const useCartStore = create<CartStore>((set, get) => {
//   const debounceUpdateCartItemQuantity = debounce(
//     async (id: string, quantity: number) => {
//       try {
//         await axios.put(
//           `${API_ROUTES.CART}/update/${id}`,
//           { quantity },
//           {
//             withCredentials: true,
//           }
//         );
//       } catch (e: any) {
//         console.error("❌ Failed to update cart quantity:", e);
//         set({ error: "Failed to update cart quantity" });
//       }
//     },
//     500 // 500ms debounce
//   );

//   return {
//     items: [],
//     isLoading: false,
//     error: null,

//     // Update the fetchCart function:
//     fetchCart: async () => {
//       set({ isLoading: true, error: null });
//       try {
//         console.log("🛒 [DEBUG] Starting fetchCart...");

//         // ✅ Log the exact URL construction
//         const baseUrl = API_ROUTES.CART;
//         const fullUrl = `${baseUrl}/fetch-cart`;

//         try {
//           const testResponse = await fetch(fullUrl, {
//             method: "GET",
//             credentials: "include",
//           });
//           console.log("🧪 [DEBUG] Route test result:", {
//             status: testResponse.status,
//             statusText: testResponse.statusText,
//             ok: testResponse.ok,
//           });
//         } catch (testError) {
//           console.log("🧪 [DEBUG] Route test failed:", testError);
//         }

//         // ✅ Now try the actual axios call

//         const response = await axios.get(fullUrl, {
//           withCredentials: true,
//           timeout: 10000,
//           headers: {
//             "Content-Type": "application/json",
//           },
//         });

//         const cartItems = response.data.data.items || [];

//         set({
//           items: cartItems,
//           isLoading: false,
//         });
//       } catch (error: any) {
//         console.error("❌ [DEBUG] fetchCart failed completely:", error);

//         const errorDetails = {
//           message: error.message,
//           code: error.code,
//           status: error.response?.status,
//           statusText: error.response?.statusText,
//           url: error.config?.url,
//           method: error.config?.method,
//           baseURL: error.config?.baseURL,
//           data: error.response?.data,
//         };

//         console.log("🔍 [DEBUG] Complete error details:", errorDetails);

//         set({
//           error: `Cart fetch failed: ${error.response?.status} ${error.response?.statusText}`,
//           isLoading: false,
//           items: [], // Reset to empty array on error
//         });
//       }
//     },

//     addToCart: async (item) => {
//       set({ isLoading: true, error: null });
//       try {
//         const response = await axios.post(
//           `${API_ROUTES.CART}/add-to-cart`,
//           item,
//           {
//             withCredentials: true,
//           }
//         );

//         set((state) => ({
//           items: [...state.items, response.data.data],
//           isLoading: false,
//         }));
//       } catch (error: any) {
//         console.error("❌ Add to cart failed:", error);
//         set({
//           error: error.response?.data?.message || "Failed to add to cart",
//           isLoading: false,
//         });
//       }
//     },

//     removeFromCart: async (id) => {
//       set({ isLoading: true, error: null });
//       try {
//         await axios.delete(`${API_ROUTES.CART}/remove/${id}`, {
//           withCredentials: true,
//         });

//         set((state) => ({
//           items: state.items.filter((item) => item.id !== id),
//           isLoading: false,
//         }));
//       } catch (error: any) {
//         console.error("❌ Remove from cart failed:", error);
//         set({
//           error: error.response?.data?.message || "Failed to delete from cart",
//           isLoading: false,
//         });
//       }
//     },

//     updateCartItemQuantity: async (id, quantity) => {
//       if (quantity < 1) return; // Prevent negative quantities

//       set((state) => ({
//         items: state.items.map((cartItem) =>
//           cartItem.id === id ? { ...cartItem, quantity } : cartItem
//         ),
//       }));

//       debounceUpdateCartItemQuantity(id, quantity);
//     },

//     clearCart: async () => {
//       set({ isLoading: true, error: null });
//       try {
//         await axios.post(
//           `${API_ROUTES.CART}/clear-cart`,
//           {},
//           {
//             withCredentials: true,
//           }
//         );

//         set({ items: [], isLoading: false });
//       } catch (error: any) {
//         console.error("❌ Clear cart failed:", error);
//         set({
//           error: error.response?.data?.message || "Failed to clear cart",
//           isLoading: false,
//         });
//       }
//     },
//   };
// });


import axios from "axios";
import debounce from "lodash/debounce";
import { create } from "zustand";
import { CartItem } from "@/types/cart/cartItemStore";

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