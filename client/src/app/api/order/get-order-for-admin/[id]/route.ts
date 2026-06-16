import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";
import { sentryTracker } from "@/lib/monitoring";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken)
      return NextResponse.json(
        { success: true, error: "Unauthenticated" },
        { status: 401 },
      );

      const { id } = await request.json()

      const backendRes = await fetch(`${API_ROUTES.ORDER}/admin/${id}`,{
        method: "GET", 
        headers: {
            "Content-Type": "application/json", 
            "Cookie": `accessToken=${accessToken}; refreshToken=${refreshToken}`
        },
      } );

      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status })

  } catch (error) {
    sentryTracker(error, { source: "api-route", route: "/api/order/get-order-for-admin/[id]", method: "GET" });
    console.log(
      "Error getting user's single order details",
      error,
    );
    return NextResponse.json(
      { success: false, error: "Error getting user's order details" },
      { status: 500 },
    );
  }
}
