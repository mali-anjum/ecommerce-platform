// app/api/auth/me/route.ts - OPTIMIZED VERSION
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyProxyCookies } from "@/lib/api/applyProxyCookies";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";
import { sentryTracker } from "@/lib/monitoring";

export async function GET(req: NextRequest) {
  const BACKEND_URL = getServerBackendUrl();
  // Early return for missing config
  if (!BACKEND_URL) {
    console.error("Backend URL not configured (BACKEND_URL / DEV_URL)");
    return NextResponse.json(
      { success: false, error: "Service configuration error" },
      { status: 500 }
    );
  }

  try {
    const cookieHeader = req.headers.get("cookie") || "";
    
    // Performance: Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Cookie": cookieHeader,  // Remove unnecessary header for get request
      },
      credentials: 'include',
      signal: controller.signal, // Add timeout protection
    });

    clearTimeout(timeoutId);

    // Handle non-OK responses efficiently
    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Backend responded with ${backendRes.status}` 
        },
        { status: backendRes.status }
      );
    }

    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    applyProxyCookies(response, backendRes);

    return response;

  } catch (error) {
    console.error("Proxy /api/auth/me error:", error);
    sentryTracker(error, { source: "api-route", route: "/api/auth/me", method: "GET" });
    
    // Better error differentiation
    if ((error as Error).name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: "Request timeout" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }
}