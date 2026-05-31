import type { AdminUserRole } from "@/types/admin/userAdminTypes";

export const ROLE_LABELS: Record<AdminUserRole, string> = {
  USER: "Customer",
  SELLER: "Seller",
  SUPER_ADMIN: "Super Admin",
};

export const roleBadgeClass: Record<AdminUserRole, string> = {
  USER: "bg-muted text-muted-foreground border-border",
  SELLER: "bg-primary/20 text-primary border-primary/20",
  SUPER_ADMIN: "bg-secondary/20 text-secondary border-secondary/20",
};
