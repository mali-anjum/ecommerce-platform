// lib/api-config.ts
export const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:4001/api'  // Development
  : `${process.env.NEXT_PUBLIC_API_URL}/api`; // Production

export const API_ROUTES = {
  AUTH: `${API_BASE_URL}/auth`,
  PRODUCTS: `${API_BASE_URL}/products`,
  COUPON: `${API_BASE_URL}/coupon`,
  SETTINGS: `${API_BASE_URL}/settings`,
  CART: `${API_BASE_URL}/cart`,
  ADDRESS: `${API_BASE_URL}/address`,
  ORDER: `${API_BASE_URL}/order`,
  CATALOG: `${API_BASE_URL}/catalog`,
};

export const ROUTES = {
  SUPER_ADMIN: "/super-admin",
  HOME: "/home",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
} as const;