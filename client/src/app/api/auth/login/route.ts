// app/api/auth/login/route.ts - PRODUCTION READY
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSetCookieHeaders } from "@/lib/api/extractSetCookieHeaders";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";

// Constants for better maintainability
const ERROR_MESSAGES = {
  BACKEND_NOT_CONFIGURED: "Backend URL not configured",
  INVALID_REQUEST: "Invalid request body",
  SERVICE_UNAVAILABLE: "Authentication service unavailable",
  TIMEOUT: "Request timeout",
} as const;

const TIMEOUT_MS = 20000; // 10 seconds

export async function POST(req: NextRequest) {
  console.log("[TRACE][CLIENT_LOGIN_PROXY] /api/auth/login hit");

  const BACKEND_URL = getServerBackendUrl();

  // Early validation with better error handling
  if (!BACKEND_URL) {
    console.error("Configuration error: backend URL not set (BACKEND_URL / DEV_URL)");

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
    const body = await req.text();

    // Validate request body
    if (!body?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.INVALID_REQUEST,
          code: "INVALID_BODY",
        },
        { status: 400 }
      );
    }

    // Parse to validate JSON structure
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          code: "INVALID_JSON",
        },
        { status: 400 }
      );
    }

    console.log("[TRACE][CLIENT_LOGIN_PROXY] Parsed request body", {
      hasEmail: Boolean(parsedBody?.email),
      passwordLength: parsedBody?.password ? String(parsedBody.password).length : 0,
    });

    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    console.log("[TRACE][CLIENT_LOGIN_PROXY] Forwarding to backend", {
      url: `${BACKEND_URL}/api/auth/login`,
    });
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify(parsedBody), // Use parsed and re-stringified body
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "NextJS-Auth-Proxy/1.0",
      },
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-OK responses with better error information
    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      let errorData;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: `Backend responded with ${backendRes.status}` };
      }
      console.warn(`Backend login failed: ${backendRes.status}`, {
        status: backendRes.status,
        error: errorData.error,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            errorData.error || `Login failed with status ${backendRes.status}`,
          code: `BACKEND_${backendRes.status}`,
        },
        { status: backendRes.status }
      );
    }

    const responseData = await backendRes.json();
    console.log("[TRACE][CLIENT_LOGIN_PROXY] Backend login success", {
      status: backendRes.status,
      hasUser: Boolean(responseData?.user),
    });
    const response = NextResponse.json(responseData, {
      status: backendRes.status,
    });

    const setCookieHeaders = extractSetCookieHeaders(backendRes);

    if (setCookieHeaders.length > 0) {
      console.log(
        `🍪 Forwarding ${setCookieHeaders.length} cookies from backend`
      );
      for (const cookie of setCookieHeaders) {
        response.headers.append("Set-Cookie", cookie);
      }
    } else {
      console.warn(
        "[CLIENT_LOGIN_PROXY] No Set-Cookie headers from backend — tokens will not persist in browser. Check Express login + Node fetch getSetCookie."
      );
    }

    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");

    return response;
  } catch (error: any) {
    console.error("Login proxy error:", error);

    // Differentiate error types for better client handling
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
