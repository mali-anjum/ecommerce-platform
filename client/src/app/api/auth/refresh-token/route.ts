// app/api/auth/refresh-token/route.ts - CORRECTED
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSetCookieHeaders } from "@/lib/api/extractSetCookieHeaders";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";
import { proxyLogger } from "@/lib/logger";

const ERROR_MESSAGES = {
  BACKEND_NOT_CONFIGURED: "Backend URL not configured",
  SERVICE_UNAVAILABLE: "Token refresh service unavailable",
  TIMEOUT: "Refresh token timeout",
} as const;

const TIMEOUT_MS = 8000;

export async function POST(req: NextRequest) {
  const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const BACKEND_URL = getServerBackendUrl();
  proxyLogger.info("refresh-token:request-start", {
    traceId,
    path: req.nextUrl.pathname,
    hasCookieHeader: Boolean(req.headers.get("cookie")),
    hasRefreshTokenCookie: req.cookies.has("refreshToken"),
    hasAccessTokenCookie: req.cookies.has("accessToken"),
  });

  if (!BACKEND_URL) {
    proxyLogger.error(
      "Configuration error: backend URL not set (BACKEND_URL / DEV_URL)",
    );
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
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      proxyLogger.warn("No refreshToken cookie found in refresh request");

      return NextResponse.json(
        {
          success: false,
          error: "No refresh token available",
          code: "NO_REFRESH_TOKEN",
        },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "NextJS-Auth-Proxy/1.0",
    };

    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    } else {
      headers["Cookie"] = `refreshToken=${refreshToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      proxyLogger.info("refresh-token:proxying-to-backend", {
        traceId,
        backendUrl: `${BACKEND_URL}/api/auth/refresh-token`,
      });
      const backendRes = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers,
        signal: controller.signal,
      });

      let backendPayload: unknown = null;
      try {
        backendPayload = await backendRes.json();
      } catch {
        if (backendRes.ok) {
          proxyLogger.error("Refresh backend returned invalid JSON payload");
          return NextResponse.json(
            {
              success: false,
              error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
              code: "INVALID_BACKEND_RESPONSE",
            },
            { status: 502 }
          );
        }
      }

      const response = NextResponse.json(
        backendRes.ok
          ? backendPayload ?? {}
          : {
              success: false,
              error: "Token refresh failed",
              code: `REFRESH_FAILED_${backendRes.status}`,
            },
        {
        status: backendRes.status,
        },
      );

      const setCookieHeaders = extractSetCookieHeaders(backendRes);
      for (const cookie of setCookieHeaders) {
        response.headers.append("Set-Cookie", cookie);
      }

      if (!backendRes.ok) {
        proxyLogger.warn("refresh-token:backend-rejected", {
          traceId,
          status: backendRes.status,
          backendPayload,
          setCookieCount: setCookieHeaders.length,
        });
      }

      if (backendRes.ok) {
        proxyLogger.info("refresh-token:backend-success", {
          traceId,
          status: backendRes.status,
          setCookieCount: setCookieHeaders.length,
        });
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    proxyLogger.error("Refresh token proxy error", {
      name: error.name,
      message: error.message,
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
