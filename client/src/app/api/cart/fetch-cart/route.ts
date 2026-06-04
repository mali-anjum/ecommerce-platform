import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";
import { sentryTracker } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  const BACKEND_URL = getServerBackendUrl();

  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 }
    );
  }

  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No access token" },
        { status: 401 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const backendRes = await fetch(`${BACKEND_URL}/api/cart/fetch-cart`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    sentryTracker(error, { source: "api-route", route: "/api/cart/fetch-cart", method: "GET" });
    const name = error instanceof Error ? error.name : "";

    if (name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Request timeout" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}
