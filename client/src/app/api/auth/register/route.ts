// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyProxyCookies } from "@/lib/api/applyProxyCookies";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";
import { sentryTracker } from "@/lib/monitoring";

export async function POST(req: NextRequest) {
  const BACKEND_URL = getServerBackendUrl();

  // Early validation
  if (!BACKEND_URL) {
    console.error("Backend URL not configured (BACKEND_URL / DEV_URL)");
    return NextResponse.json(
      { success: false, error: "Service configuration error" },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    
    // Validate request body
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Request body is required" },
        { status: 400 }
      );
    }

    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include', // ✅ Essential for cookies
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle backend errors gracefully
    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      const message =
        (typeof errorData.error === "string" && errorData.error) ||
        (typeof errorData.message === "string" && errorData.message) ||
        `Registration failed with status ${backendRes.status}`;

      return NextResponse.json(
        { success: false, error: message },
        { status: backendRes.status },
      );
    }

    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    applyProxyCookies(response, backendRes);

    return response;

  } catch (error: unknown) {
    console.error("Register proxy error:", error);
    sentryTracker(error, { source: "api-route", route: "/api/auth/register", method: "POST" });

    const cause = error instanceof Error && "cause" in error ? error.cause : null;
    const causeCode =
      cause &&
      typeof cause === "object" &&
      "code" in cause &&
      typeof cause.code === "string"
        ? cause.code
        : null;

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Registration timed out. Please try again." },
        { status: 504 },
      );
    }

    if (causeCode === "ECONNREFUSED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot reach the authentication server. Make sure the backend is running.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Registration service is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}