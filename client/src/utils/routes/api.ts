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

/**
 * Browser-side API base (`/api` on the Express host). Use the same origin as
 * `getServerBackendUrl()` / `DEV_URL` in development (e.g. `http://localhost:4001`).
 */
const publicOrigin = normalizePublicApiOrigin(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001",
);

export const API_BASE_URL = `${publicOrigin}/api`;

export const API_ROUTES = {
  AUTH: `${API_BASE_URL}/auth`,
  PRODUCTS: `${API_BASE_URL}/products`,
  SELLERS: `${API_BASE_URL}/sellers`,
  COUPON: `${API_BASE_URL}/coupon`,
  SETTINGS: `${API_BASE_URL}/settings`,
  CART: `${API_BASE_URL}/cart`,
  ADDRESS: `${API_BASE_URL}/address`,
  ORDER: `${API_BASE_URL}/order`,
  CATALOG: `${API_BASE_URL}/catalog`,
};

export const ROUTES = {
  SUPER_ADMIN: "/super-admin",
  SELLER: "/seller",
  HOME: "/home",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
} as const;