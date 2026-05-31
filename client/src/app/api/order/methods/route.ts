import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const backendRes = await fetch(`${API_ROUTES.ORDER}/methods`, {
      method: "GET",
      headers: {
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Failed to fetch payment methods:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}
