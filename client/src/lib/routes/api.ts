import { publicEnv } from "@/config/publicEnv";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * `NEXT_PUBLIC_API_URL` should be the API **origin** only (e.g. `http://localhost:4001`).
 * Strips a trailing `/api` so older env files that include `/api` still work.
 */
function normalizePublicApiOrigin(raw: string): string {
  let s = stripTrailingSlash(raw.trim());
  if (/\/api$/i.test(s)) {
    s = stripTrailingSlash(s.replace(/\/api$/i, ""));
  }
  return s;
}

const publicOrigin = normalizePublicApiOrigin(publicEnv.apiUrl);

export const API_BASE_URL = `${publicOrigin}/api`;

export const API_ROUTES = {
  AUTH: `${API_BASE_URL}/auth`,
  PRODUCTS: `${API_BASE_URL}/products`,
  SELLERS: `${API_BASE_URL}/sellers`,
  COUPON: `${API_BASE_URL}/coupon`,
  SETTINGS: `${API_BASE_URL}/settings`,
  CART: `${API_BASE_URL}/cart`,
  WISHLIST: `${API_BASE_URL}/wishlist`,
  ADDRESS: `${API_BASE_URL}/address`,
  ORDER: `${API_BASE_URL}/order`,
  USERS: `${API_BASE_URL}/users`,
  CATALOG: `${API_BASE_URL}/catalog`,
  ANALYTICS: `${API_BASE_URL}/analytics`,
  AI: `${API_BASE_URL}/ai`,
  LEADS: `${API_BASE_URL}/leads`,
};

export const ROUTES = {
  SUPER_ADMIN: "/super-admin",
  SELLER: "/seller",
  HOME: "/home",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
} as const;
