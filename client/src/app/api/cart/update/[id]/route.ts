import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    const backendRes = await fetch(
      `${BACKEND_URL}/api/cart/update/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Update cart proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update cart" },
      { status: 500 }
    );
  }
}