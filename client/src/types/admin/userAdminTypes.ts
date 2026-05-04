export type AdminUserRole = "USER" | "SELLER" | "SUPER_ADMIN";

export interface AdminUserListItem {
  id: string;
  name: string | null;
  email: string;
  role: AdminUserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  _count: {
    orders: number;
  };
}

export interface AdminUsersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUsersResponseData {
  items: AdminUserListItem[];
  meta: AdminUsersMeta;
}

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  q?: string;
  role?: AdminUserRole;
  active?: "true" | "false";
}

export interface AdminUsersStore {
  items: AdminUserListItem[];
  meta: AdminUsersMeta;
  isLoading: boolean;
  error: string | null;
  fetchUsers: (params?: AdminUsersQuery) => Promise<void>;
  setUserStatus: (userId: string, isActive: boolean) => Promise<boolean>;
  setUserRole: (userId: string, role: AdminUserRole) => Promise<boolean>;
}
