// app/api/auth/check-session/route.ts - PRODUCTION READY
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { proxyLogger } from "@/lib/logger";
import { sentryTracker } from "@/lib/monitoring";

export async function GET(req: NextRequest) {
  const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const cookies = req.cookies;
    
    const hasRefreshToken = cookies.has('refreshToken');
    const hasAccessToken = cookies.has('accessToken');
    
    // ✅ PROPER: Use getAll() correctly
    const allCookies = cookies.getAll();
    const cookieNames = allCookies.map(cookie => cookie.name);
    
    proxyLogger.info("check-session", {
      traceId,
      path: req.nextUrl.pathname,
      hasRefreshToken,
      hasAccessToken,
      cookieNames,
      userAgent: req.headers.get("user-agent") || "unknown",
    });
    
    return NextResponse.json({
      success: true,
      hasRefreshToken,
      hasAccessToken,
      cookiesPresent: cookieNames
    });
    
  } catch (error) {
    sentryTracker(error, { source: "api-route", route: "/api/auth/check-session", method: "GET" });
    proxyLogger.error("Session check error", {
      traceId,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { 
        success: false, 
        hasRefreshToken: false, 
        hasAccessToken: false,
        cookiesPresent: [] 
      },
      { status: 500 }
    );
  }
}