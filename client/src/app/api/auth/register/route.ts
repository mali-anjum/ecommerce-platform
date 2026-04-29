// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSetCookieHeaders } from "@/lib/api/extractSetCookieHeaders";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";

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
      const errorData = await backendRes.json().catch(() => ({
        error: `Backend responded with ${backendRes.status}`
      }));
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Registration failed with status ${backendRes.status}` 
        },
        { status: backendRes.status }
      );
    }

    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    const setCookieHeaders = extractSetCookieHeaders(backendRes);
    for (const cookie of setCookieHeaders) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;

  } catch (error: any) {
    console.error("Register proxy error:", error);
    
    // Differentiate error types
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: "Registration timeout - please try again" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Registration service temporarily unavailable" 
      },
      { status: 503 }
    );
  }
}