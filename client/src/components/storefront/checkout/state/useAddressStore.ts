import { create } from "zustand";
import type { Address } from "@/components/storefront/checkout/types/Address";
import { http } from "@/lib/http";
import { API_ROUTES } from "@/lib/routes/api";

interface AddressStore {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null; 

  fetchAddresses: () => Promise<void>;
  createAddress: (address: Omit<Address, "id">) => Promise<Address | null>;
  updateAddress: (
    id: string,
    address: Partial<Address>,
  ) => Promise<Address | null>;
  deleteAddress: (id: string) => Promise<boolean>;
}

export const useAddressStore = create<AddressStore>((set, get) => ({
  addresses: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchAddresses: async (force = false) => {
    // ✅ Using get() to check current state
    const state = get();
    const now = Date.now();

    // Don't fetch if we already have addresses and fetched recently
    if (
      !force &&
      state.addresses.length > 0 &&
      state.lastFetched &&
      now - state.lastFetched < 30000
    ) {
      console.log("📦 Using cached addresses");
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data } = await http.get(`${API_ROUTES.ADDRESS}/get-address`);

      set({
        addresses: data.address || [],
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: "Failed to fetch address",
        lastFetched: Date.now(), // Still update to prevent spam
      });
    }
  },

  createAddress: async (address) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await http.post(`${API_ROUTES.ADDRESS}/add-address`, address);

      set((state) => ({
        addresses: [data.address, ...state.addresses],
        isLoading: false,
      }));

      return data.address;
    } catch {
      set({ isLoading: false, error: "Failed to add address" });
      return null;
    }
  },

  updateAddress: async (id, address) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await http.put(`${API_ROUTES.ADDRESS}/update-address/${id}`, address);

      set((state) => ({
        addresses: state.addresses.map((item) =>
          item.id === id ? data.address : item,
        ),
        isLoading: false,
      }));

      return data.address;
    } catch {
      set({ isLoading: false, error: "Failed to update address" });
      return null;
    }
  },

  deleteAddress: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await http.delete(`${API_ROUTES.ADDRESS}/delete-address/${id}`);

      set((state) => ({
        addresses: state.addresses.filter((address) => address.id !== id),
        isLoading: false,
      }));

      return true;
    } catch {
      set({ isLoading: false, error: "Failed to delete address" });
      return false;
    }
  },
}));
