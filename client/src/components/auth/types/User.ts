export type ALL_USER_ROLES =
| "SUPER_ADMIN"
| "SELLER"
| "BUYER";

export type ADMIN_ONLY_ROLES = 
| "SUPER_ADMIN"
| "SELLER"

export interface User {
  id: string;
  name: string | null;
  email: string;
  role?: ALL_USER_ROLES;
  profileComplete?: boolean;
}