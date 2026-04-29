export interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "SELLER" | "SUPER_ADMIN";
}