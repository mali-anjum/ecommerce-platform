import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSetCookieHeaders } from "@/lib/api/extractSetCookieHeaders";

const ERROR_MESSAGES = {
  BACKEND_NOT_CONFIGURED: "Backend URL not configured",
  SERVICE_UNAVAILABLE: "Heartbeat service unavailable",
  TIMEOUT: "Heartbeat timeout",
} as const;

const TIMEOUT_MS = 8000;

export async function POST(req: NextRequest) {
  const BACKEND_URL =
    process.env.NODE_ENV === "production"
      ? process.env.BACKEND_URL
      : process.env.DEVE_URL;

  if (!BACKEND_URL) {
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
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "NextJS-Auth-Proxy/1.0",
    };

    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/heartbeat`, {
      method: "POST",
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseData = await backendRes.json().catch(() => ({
      success: false,
      error: `Backend responded with ${backendRes.status}`,
    }));

    const response = NextResponse.json(responseData, {
      status: backendRes.status,
    });

    const setCookieHeaders = extractSetCookieHeaders(backendRes);

    for (const cookie of setCookieHeaders) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  } catch (error: any) {
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
