import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";
import { sentryTracker } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    const visitorId = request.nextUrl.searchParams.get("visitorId");
    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "sessionId is required" },
        { status: 400 },
      );
    }

    const params = new URLSearchParams({ sessionId });
    if (visitorId) params.set("visitorId", visitorId);

    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Cookie = `accessToken=${accessToken}; refreshToken=${refreshToken ?? ""}`;
    }

    const backendRes = await fetch(
      `${API_ROUTES.AI}/sales/context?${params.toString()}`,
      { headers, cache: "no-store" },
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    sentryTracker(error, {
      source: "api-route",
      route: "/api/ai/sales/context",
      method: "GET",
    });
    return NextResponse.json(
      { success: false, message: "Failed to load sales context" },
      { status: 500 },
    );
  }
}
