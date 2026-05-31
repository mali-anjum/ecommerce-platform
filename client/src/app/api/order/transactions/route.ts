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

    const upstream = new URL(`${API_ROUTES.ORDER}/transactions`);
    request.nextUrl.searchParams.forEach((value, key) => {
      upstream.searchParams.set(key, value);
    });

    const backendRes = await fetch(upstream.toString(), {
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
    console.error("Failed to fetch admin transactions", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin transactions" },
      { status: 500 }
    );
  }
}
