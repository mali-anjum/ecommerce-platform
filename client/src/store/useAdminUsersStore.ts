import { create } from "zustand";
import { http } from "@/lib/http";
import { AxiosError } from "axios";
import {
  AdminUserListItem,
  AdminUserRole,
  AdminUsersMeta,
  AdminUsersQuery,
  AdminUsersResponseData,
  AdminUsersStore,
} from "@/types/admin/userAdminTypes";
import { ApiResult } from "@/types/order/orderTypes";

type ApiErrorPayload = { message?: string; error?: string };

function getAxiosErrorMessage(error: unknown, fallback: string): string {
  const ax = error as AxiosError<ApiErrorPayload>;
  return ax.response?.data?.message ?? ax.response?.data?.error ?? fallback;
}

const defaultMeta: AdminUsersMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

export const useAdminUsersStore = create<AdminUsersStore>((set, get) => ({
  items: [],
  meta: defaultMeta,
  isLoading: false,
  error: null,

  fetchUsers: async (params?: AdminUsersQuery) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await http.get<ApiResult<AdminUsersResponseData>>("users", {
        params,
        withCredentials: true,
      });
      const payload = data.data;
      set({
        isLoading: false,
        items: payload?.items ?? [],
        meta: payload?.meta ?? defaultMeta,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: getAxiosErrorMessage(error, "Failed to load users"),
      });
    }
  },

  setUserStatus: async (userId: string, isActive: boolean) => {
    set({ error: null });
    try {
      const { data } = await http.patch<ApiResult<AdminUserListItem>>(
        `users/${userId}/status`,
        { isActive },
        { withCredentials: true }
      );
      const updated = data.data;
      if (updated) {
        set((state) => ({
          items: state.items.map((u) => (u.id === userId ? { ...u, isActive: updated.isActive } : u)),
        }));
      }
      return true;
    } catch (error: unknown) {
      set({ error: getAxiosErrorMessage(error, "Failed to update user status") });
      return false;
    }
  },

  setUserRole: async (userId: string, role: AdminUserRole) => {
    set({ error: null });
    try {
      const { data } = await http.patch<ApiResult<AdminUserListItem>>(
        `users/${userId}/role`,
        { role },
        { withCredentials: true }
      );
      const updated = data.data;
      if (updated) {
        set((state) => ({
          items: state.items.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)),
        }));
      }
      return true;
    } catch (error: unknown) {
      set({ error: getAxiosErrorMessage(error, "Failed to update user role") });
      return false;
    }
  },
}));
