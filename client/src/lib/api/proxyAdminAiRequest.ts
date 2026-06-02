
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";

const UPLOAD_PATH_SUFFIX = "knowledge-base/upload";

function buildCookieHeader(request: NextRequest): string | null {
  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken) return null;

  const refreshToken = request.cookies.get("refreshToken")?.value ?? "";
  return `accessToken=${accessToken}; refreshToken=${refreshToken}`;
}

export async function proxyAdminAiRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string,
) {
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

  const path = `/api/ai/admin/${pathSegments.join("/")}`;
  const search = request.nextUrl.search;
  const isUpload = pathSegments.join("/").endsWith(UPLOAD_PATH_SUFFIX);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const headers: Record<string, string> = { Cookie: cookieHeader };
    let body: BodyInit | undefined;

    if (method !== "GET" && method !== "DELETE") {
      if (isUpload) {
        body = await request.formData();
      } else {
        headers["Content-Type"] = "application/json";
        body = await request.text();
      }
    }

    const backendRes = await fetch(`${backendUrl}${path}${search}`, {
      method,
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    const contentType = backendRes.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    }

    const text = await backendRes.text();
    return new NextResponse(text, { status: backendRes.status });
  } catch (error: unknown) {
    const name = error instanceof Error ? error.name : "";
    if (name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Request timeout" },
        { status: 504 },
      );
    }
    console.error("Admin AI proxy failed", error);
    return NextResponse.json(
      { success: false, error: "Admin AI request failed" },
      { status: 500 },
    );
  }
}
