import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";

/** Proxies public catalog tree (departments + subcategories + product counts) from Express. */
export async function GET(req: NextRequest) {
  const BACKEND_URL = getServerBackendUrl();

  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 }
    );
  }

  try {
    const cookieHeader = req.headers.get("cookie");
    const headers: Record<string, string> = { Accept: "application/json" };
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/catalog/tree`, {
      method: "GET",
      headers,
      credentials: "include",
      cache: "no-store",
    });

    const body = await backendRes.json().catch(() => ({}));
    return NextResponse.json(body, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Catalog service unavailable" },
      { status: 503 }
    );
  }
}
