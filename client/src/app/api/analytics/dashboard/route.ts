import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const period = request.nextUrl.searchParams.get("period") ?? "30d";
    const backendUrl = `${API_ROUTES.ANALYTICS}/dashboard?period=${encodeURIComponent(period)}`;

    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Failed to load analytics dashboard", error);
    return NextResponse.json(
      { success: false, error: "Failed to load analytics dashboard" },
      { status: 500 },
    );
  }
}
