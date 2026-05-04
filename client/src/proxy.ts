import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { proxyLogger } from "@/utils/Logger";

const publicRoutes = ["/auth/register", "/auth/login", "/help"];
const authRoutes = ["/auth/register", "/auth/login"];
const superAdminRoutes = ["/super-admin"];
const userRoutes = ["/home"];

const jwtSecret = process.env.JWT_SECRET;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  proxyLogger.info("proxy:start", { traceId, pathname });

  if (!jwtSecret) {
    proxyLogger.error("proxy: JWT_SECRET is not set", { traceId, pathname });
    if (publicRoutes.includes(pathname)) {
      proxyLogger.warn("proxy: allowing public route without JWT secret", {
        traceId,
        pathname,
      });
      return NextResponse.next();
    }
    proxyLogger.warn("proxy: redirecting to login due to missing JWT secret", {
      traceId,
      pathname,
    });
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  const hasRefreshToken = Boolean(request.cookies.get("refreshToken")?.value);
  proxyLogger.debug("proxy:cookies", {
    traceId,
    pathname,
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken,
  });

  if (!accessToken && hasRefreshToken) {
    // Role is unknown without a valid access token; allow request and let silent refresh restore session.
    proxyLogger.info("proxy:allow-missing-access-with-refresh", {
      traceId,
      pathname,
    });
    return NextResponse.next();
  }

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(jwtSecret)
      );
      const { role } = payload as { role: string };

      if (authRoutes.includes(pathname) && hasRefreshToken) {
        const postAuthHome =
          role === "SUPER_ADMIN"
            ? "/super-admin"
            : role === "SELLER"
              ? "/seller"
              : "/home";
        proxyLogger.info("proxy:redirect-auth-route-for-logged-in-user", {
          traceId,
          pathname,
          role,
          redirectTo: postAuthHome,
        });
        return NextResponse.redirect(new URL(postAuthHome, request.url));
      }

      if (
        role === "SUPER_ADMIN" &&
        userRoutes.some((route) => pathname.startsWith(route))
      ) {
        proxyLogger.info("proxy:super-admin-redirect", {
          traceId,
          pathname,
          redirectTo: "/super-admin",
        });
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }

      if (
        role === "SELLER" &&
        superAdminRoutes.some((route) => pathname.startsWith(route))
      ) {
        proxyLogger.info("proxy:seller-redirect", {
          traceId,
          pathname,
          redirectTo: "/seller",
        });
        return NextResponse.redirect(new URL("/seller", request.url));
      }

      if (role === "USER" && pathname.startsWith("/seller")) {
        const allowedUserSellerPaths =
          pathname === "/seller" || pathname.startsWith("/seller/register");
        if (!allowedUserSellerPaths) {
          proxyLogger.info("proxy:user-blocked-seller-path", {
            traceId,
            pathname,
            redirectTo: "/home",
          });
          return NextResponse.redirect(new URL("/home", request.url));
        }
      }

      if (
        role !== "SUPER_ADMIN" &&
        superAdminRoutes.some((route) => pathname.startsWith(route))
      ) {
        const fallback = role === "SELLER" ? "/seller" : "/home";
        proxyLogger.info("proxy:non-admin-blocked-admin-path", {
          traceId,
          pathname,
          role,
          redirectTo: fallback,
        });
        return NextResponse.redirect(new URL(fallback, request.url));
      }

      proxyLogger.debug("proxy:allow", { traceId, pathname, role });
      return NextResponse.next();
    } catch (error) {
      proxyLogger.warn("proxy:access-token-invalid-or-expired", {
        traceId,
        pathname,
        error: error instanceof Error ? error.message : "unknown_error",
      });
      if (!publicRoutes.includes(pathname)) {
        proxyLogger.info("proxy:redirect-login-after-invalid-token", {
          traceId,
          pathname,
        });
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
      proxyLogger.debug("proxy:allow-public-route-after-invalid-token", {
        traceId,
        pathname,
      });
      return NextResponse.next();
    }
  }

  if (!publicRoutes.includes(pathname)) {
    proxyLogger.info("proxy:no-tokens-redirect-login", { traceId, pathname });
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  proxyLogger.debug("proxy:public-route-allow", { traceId, pathname });
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
