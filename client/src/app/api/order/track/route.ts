import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";
import { sentryTracker } from "@/lib/monitoring";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = String(body?.orderId || "").trim();
    const email = String(body?.email || "").trim();

    if (!orderId || !email) {
      return NextResponse.json(
        { success: false, error: "orderId and email are required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${API_ROUTES.ORDER}/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId, email }),
      cache: "no-store",
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Failed to track order:", error);
    sentryTracker(error, { source: "api-route", route: "/api/order/track", method: "POST" });
    return NextResponse.json(
      { success: false, error: "Failed to track order" },
      { status: 500 }
    );
  }
}
