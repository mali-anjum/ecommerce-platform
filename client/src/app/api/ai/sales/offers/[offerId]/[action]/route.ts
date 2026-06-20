import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";
import { sentryTracker } from "@/lib/monitoring";

async function proxyAction(
  request: NextRequest,
  offerId: string,
  action: "shown" | "dismiss",
) {
  try {
    const body = await request.json();
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers.Cookie = `accessToken=${accessToken}; refreshToken=${refreshToken ?? ""}`;
    }

    const backendRes = await fetch(
      `${API_ROUTES.AI}/sales/offers/${offerId}/${action}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    sentryTracker(error, {
      source: "api-route",
      route: `/api/ai/sales/offers/${offerId}/${action}`,
      method: "POST",
    });
    return NextResponse.json(
      { success: false, message: "Failed to update sales offer" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ offerId: string; action: string }> },
) {
  const { offerId, action } = await context.params;
  if (action !== "shown" && action !== "dismiss") {
    return NextResponse.json(
      { success: false, message: "Unsupported action" },
      { status: 404 },
    );
  }

  return proxyAction(request, offerId, action);
}
