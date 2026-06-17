import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { sentryTracker } from "@/lib/monitoring";

type RouteContext = { params: Promise<{ productId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isFeatureEnabled("ai.reviewAnalyzer")) {
    return NextResponse.json(
      { success: false, message: "Product reviews are disabled" },
      { status: 403 },
    );
  }

  try {
    const { productId } = await context.params;
    const backendRes = await fetch(
      `${API_ROUTES.REVIEWS}/product/${productId}`,
      { cache: "no-store" },
    );
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    sentryTracker(error, {
      source: "api-route",
      route: "/api/reviews/product/[productId]",
      method: "GET",
    });
    return NextResponse.json(
      { success: false, message: "Failed to load reviews" },
      { status: 500 },
    );
  }
}
