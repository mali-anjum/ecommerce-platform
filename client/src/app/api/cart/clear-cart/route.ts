import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";

export async function POST(request: NextRequest) {
  const BACKEND_URL = getServerBackendUrl();

  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 }
    );
  }

  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/cart/clear-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Clear cart proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}