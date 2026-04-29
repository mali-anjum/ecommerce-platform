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
const getBackendUrl = () =>
  process.env.NODE_ENV === "production"
    ? process.env.BACKEND_URL
    : process.env.DEV_URL || process.env.BACKEND_URL;

export async function POST(req: NextRequest) {
  const BACKEND_URL = getBackendUrl();

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
    const allCookies = req.cookies.getAll();
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

      if (!backendRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: "Token refresh failed",
            code: `REFRESH_FAILED_${backendRes.status}`,
          },
          { status: backendRes.status }
        );
      }

      const response = NextResponse.json(backendPayload ?? {}, {
        status: backendRes.status,
      });

      const setCookieHeaders = extractSetCookieHeaders(backendRes);
      for (const cookie of setCookieHeaders) {
        response.headers.append("Set-Cookie", cookie);
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
