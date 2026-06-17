import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { sentryTracker } from "@/lib/monitoring";

export async function POST(request: NextRequest) {
  if (!isFeatureEnabled("ai.smartSearch")) {
    return NextResponse.json(
      { success: false, message: "Smart search is disabled" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as { query?: string; limit?: number };
    if (!body.query?.trim()) {
      return NextResponse.json(
        { success: false, message: "query is required" },
        { status: 400 },
      );
    }

    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers.Cookie = `accessToken=${accessToken}; refreshToken=${refreshToken ?? ""}`;
    }

    const backendRes = await fetch(`${API_ROUTES.AI}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: body.query.trim(),
        limit: body.limit,
      }),
      cache: "no-store",
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    sentryTracker(error, {
      source: "api-route",
      route: "/api/ai/search",
      method: "POST",
    });
    return NextResponse.json(
      { success: false, message: "Smart search failed" },
      { status: 500 },
    );
  }
}
