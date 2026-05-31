import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await context.params;
    const body = await request.json();

    const backendRes = await fetch(`${API_ROUTES.USERS}/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Failed to update user role", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
