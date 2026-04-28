// app/api/auth/refresh-token/route.ts - CORRECTED
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSetCookieHeaders } from "@/lib/api/extractSetCookieHeaders";
import { proxyLogger } from "@/utils/Logger";

const ERROR_MESSAGES = {
  BACKEND_NOT_CONFIGURED: "Backend URL not configured",
  SERVICE_UNAVAILABLE: "Token refresh service unavailable",
  TIMEOUT: "Refresh token timeout",
} as const;

const TIMEOUT_MS = 8000;

export async function POST(req: NextRequest) {
  const BACKEND_URL =
    process.env.NODE_ENV === "production"
      ? process.env.BACKEND_URL
      : process.env.DEVE_URL;

  if (!BACKEND_URL) {
    proxyLogger.error("Configuration error: BACKEND_URL not set");
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.BACKEND_NOT_CONFIGURED,
        code: "CONFIG_ERROR",
      },
      { status: 500 }
    );
  }

  try {
    // Get ALL cookies from the request
    const allCookies = req.cookies.getAll();
    const cookieNames = allCookies.map((cookie) => cookie.name);

    proxyLogger.info("🔍 All cookies present:", cookieNames);
    proxyLogger.info("🔍 Has refreshToken:", req.cookies.has("refreshToken"));

    // Get the refreshToken cookie specifically
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      proxyLogger.error("❌ No refreshToken cookie found in request");
      proxyLogger.error(
        "Available cookies:",
        allCookies.map((c) => ({
          name: c.name,
          value: c.value ? `[${c.value.length} chars]` : "empty",
        }))
      );

      return NextResponse.json(
        {
          success: false,
          error: "No refresh token available",
          code: "NO_REFRESH_TOKEN",
          debug: {
            availableCookies: cookieNames,
            cookieCount: allCookies.length,
          },
        },
        { status: 401 }
      );
    }

    proxyLogger.log("✅ Refresh token found, length:", refreshToken.length);

    // Prepare headers for backend request
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "NextJS-Auth-Proxy/1.0",
    };

    // OPTION 1: Forward ALL cookies (recommended)
    // Get the full cookie string
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
      proxyLogger.log("📦 Forwarding all cookies via Cookie header");
    } else {
      // OPTION 2: Construct cookie header with just the refresh token
      headers["Cookie"] = `refreshToken=${refreshToken}`;
      proxyLogger.log("📦 Constructed Cookie header with refresh token only");
    }

    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    proxyLogger.log("🚀 Sending request to backend:", {
      url: `${BACKEND_URL}/api/auth/refresh-token`,
      hasCookieHeader: !!headers["Cookie"],
      cookieHeaderLength: headers["Cookie"]?.length,
    });

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers,
      credentials: "include", // Important: include cookies
      signal: controller.signal,
    });

    proxyLogger.log("🔧 Backend Response:", {
      status: backendRes.status,
      statusText: backendRes.statusText,
      ok: backendRes.ok,
      url: `${BACKEND_URL}/api/auth/refresh-token`,
    });

    clearTimeout(timeoutId);

    if (!backendRes.ok) {
      let errorText = "";
      try {
        errorText = await backendRes.text();
      } catch (e) {
        errorText = "Could not read error response";
      }

      return NextResponse.json(
        {
          success: false,
          error: "Token refresh failed",
          code: `REFRESH_FAILED_${backendRes.status}`,
          debug: {
            backendStatus: backendRes.status,
            backendResponse: errorText.substring(0, 200),
            nextJsHadRefreshToken: !!refreshToken,
            cookieNames: cookieNames,
          },
        },
        { status: backendRes.status }
      );
    }

    const responseData = await backendRes.json();
    proxyLogger.log("✅ Token refresh successful:", {
      hasAccessToken: !!responseData.accessToken,
      hasTokenInfo: !!responseData.tokenInfo,
    });

    const response = NextResponse.json(responseData, {
      status: backendRes.status,
    });

    const setCookieHeaders = extractSetCookieHeaders(backendRes);

    if (setCookieHeaders.length > 0) {
      proxyLogger.log(
        `🍪 Backend Set-Cookie headers count:`,
        setCookieHeaders.length
      );

      for (const cookie of setCookieHeaders) {
        response.headers.append("Set-Cookie", cookie);
        proxyLogger.log(
          "   Set-Cookie:",
          cookie.substring(0, 80) + (cookie.length > 80 ? "..." : "")
        );
      }
    } else {
      proxyLogger.log("📭 No Set-Cookie headers from backend");
    }

    return response;
  } catch (error: any) {
    proxyLogger.error("❌ Refresh token proxy error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.TIMEOUT,
          code: "TIMEOUT",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
        code: "SERVICE_UNAVAILABLE",
      },
      { status: 503 }
    );
  }
}
