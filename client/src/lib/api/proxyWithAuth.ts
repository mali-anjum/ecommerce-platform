import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";

type ProxyOptions = {
  method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
  backendPath: string;
  body?: unknown;
};

export async function proxyWithAuth(
  request: NextRequest,
  { method, backendPath, body }: ProxyOptions
) {
  const BACKEND_URL = getServerBackendUrl();

  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 }
    );
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - No access token" },
      { status: 401 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const backendRes = await fetch(`${BACKEND_URL}${backendPath}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    const name = error instanceof Error ? error.name : "";
    if (name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Request timeout" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Wishlist request failed" },
      { status: 500 }
    );
  }
}
