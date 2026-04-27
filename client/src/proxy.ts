import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/auth/register", "/auth/login"];
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

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(jwtSecret)
      );
      const { role } = payload as { role: string };

      if (publicRoutes.includes(pathname)) {
        return NextResponse.redirect(
          new URL(role === "SUPER_ADMIN" ? "/super-admin" : "/home", request.url)
        );
      }

      if (
        role === "SUPER_ADMIN" &&
        userRoutes.some((route) => pathname.startsWith(route))
      ) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }
      if (
        role !== "SUPER_ADMIN" &&
        superAdminRoutes.some((route) => pathname.startsWith(route))
      ) {
        return NextResponse.redirect(new URL("/home", request.url));
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
