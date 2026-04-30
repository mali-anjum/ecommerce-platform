import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/auth/register", "/auth/login", "/track-order", "/help"];
const authRoutes = ["/auth/register", "/auth/login"];
const superAdminRoutes = ["/super-admin"];
const userRoutes = ["/home"];

const jwtSecret = process.env.JWT_SECRET;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!jwtSecret) {
    console.error("proxy: JWT_SECRET is not set");
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  const hasRefreshToken = Boolean(request.cookies.get("refreshToken")?.value);

  if (!accessToken && hasRefreshToken) {
    // Role is unknown without a valid access token; allow request and let silent refresh restore session.
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
        return NextResponse.redirect(new URL(postAuthHome, request.url));
      }

      if (
        role === "SUPER_ADMIN" &&
        userRoutes.some((route) => pathname.startsWith(route))
      ) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }

      if (
        role === "SELLER" &&
        superAdminRoutes.some((route) => pathname.startsWith(route))
      ) {
        return NextResponse.redirect(new URL("/seller", request.url));
      }

      if (role === "USER" && pathname.startsWith("/seller")) {
        const allowedUserSellerPaths =
          pathname === "/seller" || pathname.startsWith("/seller/register");
        if (!allowedUserSellerPaths) {
          return NextResponse.redirect(new URL("/home", request.url));
        }
      }

      if (
        role !== "SUPER_ADMIN" &&
        superAdminRoutes.some((route) => pathname.startsWith(route))
      ) {
        const fallback = role === "SELLER" ? "/seller" : "/home";
        return NextResponse.redirect(new URL(fallback, request.url));
      }

      return NextResponse.next();
    } catch {
      if (!publicRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
      return NextResponse.next();
    }
  }

  if (!publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
