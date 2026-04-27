// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSetCookieHeaders } from "@/lib/api/extractSetCookieHeaders";

export async function POST(req: NextRequest) {
   const BACKEND_URL =
    process.env.NODE_ENV === "production"
      ? process.env.BACKEND_URL
      : process.env.DEVE_URL;
  
  if (!BACKEND_URL) {
    console.error("BACKEND_URL not configured");
    return NextResponse.json(
      { success: false, error: "Service configuration error" },
      { status: 500 }
    );
  }

  try {
    const cookieHeader = req.headers.get("cookie") || "";

    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
      },
      credentials: 'include', // ✅ Essential for cookies
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle backend errors
    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Logout failed with status ${backendRes.status}` 
        },
        { status: backendRes.status }
      );
    }

    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    // ✅ Clear cookies properly on logout
    const setCookieHeaders = extractSetCookieHeaders(backendRes);
    if (setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        response.headers.append('Set-Cookie', cookie);
      }
      console.log(`🔒 Logout processed - cleared ${setCookieHeaders.length} cookies`);
    } else {
      // Fallback: must match how `authController` sets cookies (dev: no Secure; prod: Secure + SameSite=None).
      const isProd = process.env.NODE_ENV === "production";
      if (isProd) {
        const domain = ".ecommerce-platform-with-prisma.vercel.app";
        response.headers.append(
          "Set-Cookie",
          `accessToken=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0; Domain=${domain}`
        );
        response.headers.append(
          "Set-Cookie",
          `refreshToken=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0; Domain=${domain}`
        );
      } else {
        // localhost: host-only cookies (no Domain); Secure would not match login cookies on http://
        response.headers.append(
          "Set-Cookie",
          `accessToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
        );
        response.headers.append(
          "Set-Cookie",
          `refreshToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
        );
      }
    }

    return response;

  } catch (error: any) {
    console.error("Logout proxy error:", error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: "Logout timeout" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Logout service unavailable" },
      { status: 503 }
    );
  }
}