import { NextRequest, NextResponse } from "next/server";
import { applyProxyCookies } from "@/lib/api/applyProxyCookies";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";
import { sentryTracker } from "@/lib/monitoring";

/**
 * Thin BFF handoff: exchanges a one-time OAuth code from Express for auth cookies
 * on the Next.js origin. Contains no OAuth protocol logic.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?oauth_error=Missing%20OAuth%20exchange%20code", req.url),
    );
  }

  const backendUrl = getServerBackendUrl();
  if (!backendUrl) {
    return NextResponse.redirect(
      new URL("/auth/login?oauth_error=Backend%20not%20configured", req.url),
    );
  }

  try {
    const backendRes = await fetch(
      `${backendUrl}/api/auth/oauth/exchange?code=${encodeURIComponent(code)}`,
      { method: "GET", cache: "no-store" },
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      const message = encodeURIComponent(
        data.error ?? "OAuth session exchange failed",
      );
      return NextResponse.redirect(new URL(`/auth/login?oauth_error=${message}`, req.url));
    }

    const redirectPath =
      typeof data.redirectTo === "string"
        ? new URL(data.redirectTo).pathname + new URL(data.redirectTo).search
        : "/home";

    const response = NextResponse.redirect(new URL(redirectPath, req.url));

    applyProxyCookies(response, backendRes);

    return response;
  } catch (error) {
    console.error("OAuth complete proxy error:", error);
    sentryTracker(error, { source: "api-route", route: "/api/auth/oauth/complete", method: "GET" });
    return NextResponse.redirect(
      new URL("/auth/login?oauth_error=OAuth%20session%20handoff%20failed", req.url),
    );
  }
}
