import { NextRequest, NextResponse } from "next/server";
import { extractSetCookieHeaders } from "@/lib/api/extractSetCookieHeaders";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";

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

    for (const cookie of extractSetCookieHeaders(backendRes)) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  } catch (error) {
    console.error("OAuth complete proxy error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?oauth_error=OAuth%20session%20handoff%20failed", req.url),
    );
  }
}
