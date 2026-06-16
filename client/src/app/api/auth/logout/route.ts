// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyProxyCookies } from "@/lib/api/applyProxyCookies";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";
import { sentryTracker } from "@/lib/monitoring";

export async function POST(req: NextRequest) {
  const BACKEND_URL = getServerBackendUrl();

  if (!BACKEND_URL) {
    console.error("Backend URL not configured (BACKEND_URL / DEV_URL)");
    return NextResponse.json(
      { success: false, error: "Service configuration error" },
      { status: 500 }
    );
  }

  try {
    const cookieHeader = req.headers.get("cookie") || "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `Logout failed with status ${backendRes.status}`,
        },
        { status: backendRes.status }
      );
    }

    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    const applied = applyProxyCookies(response, backendRes);
    if (applied > 0) {
      console.log(`🔒 Logout processed - cleared ${applied} cookies`);
    }

    return response;
  } catch (error: unknown) {
    console.error("Logout proxy error:", error);
    sentryTracker(error, { source: "api-route", route: "/api/auth/logout", method: "POST" });

    if (error instanceof Error && error.name === "AbortError") {
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
