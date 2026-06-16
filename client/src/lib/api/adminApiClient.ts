import axios from "axios";
import { attachAxiosErrorReporting } from "@/lib/monitoring";

/** Same-origin BFF client for super-admin routes (cookies forwarded by Next proxies). */
export const adminApi = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

attachAxiosErrorReporting(adminApi, "adminApi");

export function unwrapData<T>(response: { data: { data?: T } }): T {
  return response.data.data as T;
}

export const AI_ADMIN_ROUTES = {
  faq: "/ai/admin/faq",
  knowledgeBase: "/ai/admin/knowledge-base",
  knowledgeBaseUpload: "/ai/admin/knowledge-base/upload",
  analytics: "/ai/admin/analytics",
  supportTickets: "/ai/admin/support-tickets",
  policies: "/ai/policies",
} as const;

export const LEADS_ROUTE = "/leads";
