import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";
import { sentryTracker } from "@/lib/monitoring";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const backendRes = await fetch(`${API_ROUTES.ORDER}/capture-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Failes to capture-order: captureOrder", error);
    sentryTracker(error, { source: "api-route", route: "/api/order/capture-order", method: "POST" });
    return NextResponse.json(
      { success: false, error: "Failes to capture-order: captureOrder" },
      { status: 500 }
    );
  }
}