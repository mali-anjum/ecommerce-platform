/**
 * Asserts which middleware guards each route, so removing an auth/role check fails CI.
 * Walks the Express router stack instead of booting the app (no DB, no network).
 */
jest.mock("../../lib/prisma", () => ({ __esModule: true, prisma: {}, default: {} }));
jest.mock("../../config/cloudinary", () => ({ __esModule: true, default: { uploader: {}, api: {} } }));
jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
// arctic is ESM-only; the OAuth controllers are imported via authRoutes.
jest.mock("arctic", () => ({
  Google: jest.fn(),
  Facebook: jest.fn(),
  GitHub: jest.fn(),
  MicrosoftEntraId: jest.fn(),
  Apple: jest.fn(),
  OAuth2RequestError: class OAuth2RequestError extends Error {},
  generateState: jest.fn(),
  generateCodeVerifier: jest.fn(),
}));

import type { Router } from "express";
import { authenticateJwt, isSuperAdmin } from "../../middleware/authMiddleware";
import { optionalAuthenticateJwt } from "../../middleware/optionalAuthMiddleware";
import { attachSellerProfile, requireSellerOrSuperAdmin } from "../../middleware/sellerMiddleware";
import { aiChatLimiter, aiSearchLimiter, analyticsEventLimiter, publicFormLimiter } from "../../middleware/publicRateLimiter";
import { authLoginLimiter, authRegisterLimiter } from "../../middleware/authRateLimiter";
import addressRoutes from "../addressRoutes";
import aiRoutes from "../aiRoutes";
import analyticsRoutes from "../analyticsRoutes";
import authRoutes from "../authRoutes";
import cartRoutes from "../cartRoutes";
import catalogRoutes from "../catalogRoutes";
import couponRoutes from "../couponRoutes";
import leadRoutes from "../leadRoutes";
import orderRoutes from "../orderRoutes";
import productRoutes from "../productRoutes";
import reviewRoutes from "../reviewRoutes";
import sellerRoutes from "../sellerRoutes";
import settingRoutes from "../settingRoutes";
import userRoutes from "../userRoutes";
import wishlistRoutes from "../wishlistRoutes";

type Handler = (...args: unknown[]) => unknown;
type Layer = {
  handle: Handler;
  route?: { path: string; methods: Record<string, boolean>; stack: Layer[] };
};

/** Middleware that runs for `METHOD path`: router-level `use` layers before it, then the route's own stack. */
function chain(router: Router, method: string, path: string): Handler[] {
  const applied: Handler[] = [];
  for (const layer of (router as unknown as { stack: Layer[] }).stack) {
    if (!layer.route) {
      applied.push(layer.handle);
      continue;
    }
    if (layer.route.path === path && layer.route.methods[method.toLowerCase()]) {
      return [...applied, ...layer.route.stack.map((l) => l.handle)];
    }
  }
  throw new Error(`Route not found: ${method} ${path}`);
}

function expectGuards(router: Router, method: string, path: string, guards: Handler[]) {
  const handlers = chain(router, method, path);
  for (const guard of guards) {
    expect({ route: `${method} ${path}`, guarded: handlers.includes(guard) }).toEqual({
      route: `${method} ${path}`,
      guarded: true,
    });
  }
}

function expectNotGuarded(router: Router, method: string, path: string, guard: Handler) {
  expect(chain(router, method, path)).not.toContain(guard);
}

const ADMIN = [authenticateJwt, isSuperAdmin] as Handler[];
const AUTH = [authenticateJwt] as Handler[];

describe("route guards", () => {
  it.each([
    ["GET", "/fetch-all-coupons"],
    ["POST", "/create-coupon"],
    ["DELETE", "/:id"],
  ])("coupon %s %s is super-admin only", (method, path) => {
    expectGuards(couponRoutes, method, path, ADMIN);
  });

  it("lets any signed-in shopper validate a coupon code", () => {
    expectGuards(couponRoutes, "POST", "/validate", AUTH);
    expectNotGuarded(couponRoutes, "POST", "/validate", isSuperAdmin as Handler);
  });

  it.each([
    ["GET", "/"],
    ["PATCH", "/:userId/status"],
    ["PATCH", "/:userId/role"],
  ])("user admin %s %s is super-admin only", (method, path) => {
    expectGuards(userRoutes, method, path, ADMIN);
  });

  it.each([
    ["POST", "/banners"],
    ["POST", "/update-feature-products"],
  ])("settings %s %s is super-admin only", (method, path) => {
    expectGuards(settingRoutes, method, path, ADMIN);
  });

  it("keeps storefront settings reads public", () => {
    expectNotGuarded(settingRoutes, "GET", "/get-banners", authenticateJwt as Handler);
    expectNotGuarded(settingRoutes, "GET", "/fetch-feature-products", authenticateJwt as Handler);
  });

  it.each([
    ["POST", "/admin/seed-from-constants"],
    ["POST", "/admin/departments"],
    ["PUT", "/admin/departments/:id"],
    ["DELETE", "/admin/departments/:id"],
    ["POST", "/admin/subcategories"],
    ["PUT", "/admin/subcategories/:id"],
    ["DELETE", "/admin/subcategories/:id"],
  ])("catalog %s %s is super-admin only", (method, path) => {
    expectGuards(catalogRoutes, method, path, ADMIN);
  });

  it("keeps payment webhooks unauthenticated (they are signature-verified)", () => {
    for (const path of ["/webhooks/paypal", "/webhooks/stripe", "/webhooks/:provider"]) {
      expectNotGuarded(orderRoutes, "POST", path, authenticateJwt as Handler);
    }
  });

  it.each([
    ["POST", "/create-order"],
    ["POST", "/capture-order"],
    ["GET", "/get-all-orders"],
    ["GET", "/:orderId"],
  ])("order %s %s requires sign-in", (method, path) => {
    expectGuards(orderRoutes, method, path, AUTH);
  });

  it.each([
    ["GET", "/get-all-orders-for-admin"],
    ["PUT", "/:orderId/status"],
    ["PUT", "/:orderId/tracking"],
    ["POST", "/:orderId/tracking/events"],
    ["GET", "/transactions"],
    ["GET", "/admin/:orderId"],
  ])("order admin %s %s is super-admin only", (method, path) => {
    expectGuards(orderRoutes, method, path, ADMIN);
  });

  it("scopes seller sales to the seller profile", () => {
    expectGuards(orderRoutes, "GET", "/seller/my-sales", [authenticateJwt, attachSellerProfile] as Handler[]);
  });

  it.each([
    ["POST", "/create-new-product"],
    ["GET", "/fetch-admin-products"],
    ["PUT", "/:id"],
    ["DELETE", "/:id"],
  ])("product %s %s needs a seller or super admin", (method, path) => {
    expectGuards(productRoutes, method, path, [authenticateJwt, requireSellerOrSuperAdmin, attachSellerProfile] as Handler[]);
  });

  it("does not expose a debug upload route", () => {
    expect(() => chain(productRoutes, "POST", "/debug-multer")).toThrow("Route not found");
  });

  it.each([
    [cartRoutes, "GET", "/fetch-cart"],
    [cartRoutes, "POST", "/add-to-cart"],
    [cartRoutes, "DELETE", "/remove/:id"],
    [cartRoutes, "PUT", "/update/:id"],
    [cartRoutes, "POST", "/clear-cart"],
    [wishlistRoutes, "GET", "/"],
    [wishlistRoutes, "POST", "/toggle"],
    [wishlistRoutes, "DELETE", "/remove/:id"],
    [addressRoutes, "POST", "/add-address"],
    [addressRoutes, "GET", "/get-address"],
    [addressRoutes, "PUT", "/update-address/:id"],
    [addressRoutes, "DELETE", "/delete-address/:id"],
    [sellerRoutes, "POST", "/register"],
    [sellerRoutes, "GET", "/me"],
    [reviewRoutes, "POST", "/"],
    [authRoutes, "GET", "/me"],
  ])("%#: %s %s requires sign-in", (router, method, path) => {
    expectGuards(router as Router, method as string, path as string, AUTH);
  });

  it("rate-limits login and registration", () => {
    expectGuards(authRoutes, "POST", "/login", [authLoginLimiter] as Handler[]);
    expectGuards(authRoutes, "POST", "/register", [authRegisterLimiter] as Handler[]);
  });

  it("rate-limits public AI and form endpoints", () => {
    expectGuards(aiRoutes, "POST", "/chat", [aiChatLimiter, optionalAuthenticateJwt] as Handler[]);
    expectGuards(aiRoutes, "POST", "/search", [aiSearchLimiter] as Handler[]);
    expectGuards(aiRoutes, "POST", "/sales/capture-email", [publicFormLimiter] as Handler[]);
    expectGuards(leadRoutes, "POST", "/", [publicFormLimiter] as Handler[]);
    expectGuards(analyticsRoutes, "POST", "/events", [analyticsEventLimiter] as Handler[]);
  });

  it.each([
    ["GET", "/admin/analytics"],
    ["GET", "/admin/support-tickets"],
    ["POST", "/admin/faq"],
    ["DELETE", "/admin/knowledge-base/:id"],
    ["PUT", "/admin/policies"],
    ["POST", "/admin/seo-generator"],
  ])("AI admin %s %s is super-admin only", (method, path) => {
    expectGuards(aiRoutes, method, path, ADMIN);
  });

  it("keeps lead listing and the analytics dashboard admin-only", () => {
    expectGuards(leadRoutes, "GET", "/", ADMIN);
    expectGuards(analyticsRoutes, "GET", "/dashboard", ADMIN);
  });
});
