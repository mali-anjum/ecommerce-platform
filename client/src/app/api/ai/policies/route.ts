import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";

function buildCookieHeader(request: NextRequest): string | null {
  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken) return null;
  const refreshToken = request.cookies.get("refreshToken")?.value ?? "";
  return `accessToken=${accessToken}; refreshToken=${refreshToken}`;
}

export async function GET() {
  const backendUrl = getServerBackendUrl();
  if (!backendUrl) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 },
    );
  }

  try {
    const backendRes = await fetch(`${backendUrl}/api/ai/policies`, {
      cache: "no-store",
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Policies proxy GET failed", error);
    return NextResponse.json(
      { success: false, error: "Failed to load store policies" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const backendUrl = getServerBackendUrl();
  if (!backendUrl) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 },
    );
  }

  const cookieHeader = buildCookieHeader(request);
  if (!cookieHeader) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - No access token" },
      { status: 401 },
    );
  }

  try {
    const body = await request.text();
    const backendRes = await fetch(`${backendUrl}/api/ai/admin/policies`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body,
      cache: "no-store",
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Policies proxy PUT failed", error);
    return NextResponse.json(
      { success: false, error: "Failed to save store policies" },
      { status: 500 },
    );
  }
}
