import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";
import { sentryTracker } from "@/lib/monitoring";

function buildCookieHeader(request: NextRequest): string | null {
  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken) return null;
  const refreshToken = request.cookies.get("refreshToken")?.value ?? "";
  return `accessToken=${accessToken}; refreshToken=${refreshToken}`;
}

export async function GET(request: NextRequest) {
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
    const search = request.nextUrl.search;
    const backendRes = await fetch(`${backendUrl}/api/leads${search}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Leads proxy GET failed", error);
    sentryTracker(error, { source: "api-route", route: "/api/leads", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to load leads" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const backendUrl = getServerBackendUrl();
  if (!backendUrl) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.text();
    const backendRes = await fetch(`${backendUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Lead proxy POST failed", error);
    sentryTracker(error, { source: "api-route", route: "/api/leads", method: "GET" });
    return NextResponse.json(
      { success: false, message: "Failed to submit lead" },
      { status: 500 },
    );
  }
}
