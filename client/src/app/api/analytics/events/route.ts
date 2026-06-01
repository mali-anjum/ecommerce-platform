import { API_ROUTES } from "@/lib/routes/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    const backendRes = await fetch(`${API_ROUTES.ANALYTICS}/events`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Analytics event proxy failed", error);
    return NextResponse.json(
      { success: false, message: "Failed to log analytics event" },
      { status: 500 },
    );
  }
}
