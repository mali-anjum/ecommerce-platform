import { Role } from "@prisma/client";

export const ADMIN_USER_ROLE_ALLOWLIST = new Set<Role>([
  "USER",
  "SELLER",
  "SUPER_ADMIN",
]);
