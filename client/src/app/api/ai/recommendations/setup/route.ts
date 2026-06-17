import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { sentryTracker } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  if (!isFeatureEnabled("ai.productRecommendations")) {
    return NextResponse.json(
      { success: false, message: "Product recommendations are disabled" },
      { status: 403 },
    );
  }

  try {
    const productId = request.nextUrl.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json(
        { success: false, message: "productId is required" },
        { status: 400 },
      );
    }

    const params = new URLSearchParams(request.nextUrl.searchParams);
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Cookie = `accessToken=${accessToken}; refreshToken=${refreshToken ?? ""}`;
    }

    const backendRes = await fetch(
      `${API_ROUTES.AI}/recommendations/setup?${params.toString()}`,
      { headers, cache: "no-store" },
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    sentryTracker(error, {
      source: "api-route",
      route: "/api/ai/recommendations/setup",
      method: "GET",
    });
    return NextResponse.json(
      { success: false, message: "Failed to load setup recommendations" },
      { status: 500 },
    );
  }
}
