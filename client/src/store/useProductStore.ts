import { API_ROUTES } from "@/utils/routes/api";
import axios from "axios";
import { create } from "zustand";
import type { Product, ProductFilters } from "@/types/product";

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  fetchAllProductsForAdmin: () => Promise<void>;
  createProduct: (productData: FormData) => Promise<Product>;
  updateProduct: (id: string, productData: FormData) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;
  getProductById: (id: string) => Promise<Product | null>;
  fetchProductsForClient: (params: ProductFilters) => Promise<void>;
  setCurrentPage: (page: number) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: true,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalProducts: 0,

  fetchAllProductsForAdmin: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_ROUTES.PRODUCTS}/fetch-admin-products`,
        {
          withCredentials: true,
        }
      );

      const productsData =
        response.data.data?.items ||
        response.data.items ||
        response.data.data ||
        [];

      set({
        products: productsData,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("Failed to fetch admin products:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch products",
        isLoading: false,
        products: [], // ✅ Reset products on error
      });
    }
  },

  createProduct: async (productData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${API_ROUTES.PRODUCTS}/create-new-product`,
        productData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      console.error("Failed to create product:", error);
      set({
        error: error.response?.data?.message || "Failed to create product",
        isLoading: false,
      });
      throw error; // Re-throw to handle in component
    }
  },

  updateProduct: async (id: string, productData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(
        `${API_ROUTES.PRODUCTS}/${id}`,
        productData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data", // Changed from application/json
          },
        }
      );

      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      console.error("Failed to update product:", error);
      set({
        error: error.response?.data?.message || "Failed to update product",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`${API_ROUTES.PRODUCTS}/${id}`, {
        withCredentials: true,
      });

      set({ isLoading: false });
      return response.data.success;
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      set({
        error: error.response?.data?.message || "Failed to delete product",
        isLoading: false,
      });
      return false;
    }
  },

  getProductById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_ROUTES.PRODUCTS}/${id}`, {
        withCredentials: true,
      });

      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch product:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch product",
        isLoading: false,
      });
      return null;
    }
  },

  fetchProductsForClient: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = {
        ...params,
        categories: params.categories?.join(","),
        sizes: params.sizes?.join(","),
        colors: params.colors?.join(","),
        brands: params.brands?.join(","),
        search: params.search || undefined,
        mainCategory: params.mainCategory || undefined,
        subcategory: params.subcategory || undefined,
        collection:
          params.collection && params.collection !== "all"
            ? params.collection
            : undefined,
      };

      // console.log("Fetching client products with params:", queryParams);

      const response = await axios.get(
        `${API_ROUTES.PRODUCTS}/fetch-client-products`,
        {
          params: queryParams,
          withCredentials: true,
        }
      );

      // console.log("RESPONSE_OBJECT", response);

      // ✅ FIX: Access the nested data structure correctly
      const responseData = response.data.data || response.data;

      // console.log("Client products fetched successfully:", {
      //   productsCount: responseData.products?.length,
      //   currentPage: responseData.currentPage,
      //   totalPages: responseData.totalPages,
      //   totalProducts: responseData.totalProducts,
      // });

      set({
        products: responseData.products || [],
        currentPage: responseData.currentPage || 1,
        totalPages: responseData.totalPages || 1,
        totalProducts: responseData.totalProducts || 0,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("Failed to fetch client products:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch products",
        isLoading: false,
        products: [],
      });
    }
  },

  setCurrentPage: (page: number) => set({ currentPage: page }),
}));
