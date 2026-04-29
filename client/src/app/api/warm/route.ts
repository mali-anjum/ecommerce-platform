// app/api/warm/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";

const TIMEOUT_MS = 10000;

export async function GET(req: NextRequest) {
  const BACKEND_URL = getServerBackendUrl();

  if (!BACKEND_URL) {
    console.error("Configuration error: backend URL not set (BACKEND_URL / DEV_URL)");
    return NextResponse.json(
      {
        status: "cold",
        error: "Backend URL not configured",
      },
      { status: 500 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    console.log(`🔥 Warming up backend: ${BACKEND_URL}/api/warm`);
    
    const backendRes = await fetch(`${BACKEND_URL}/api/warm`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "NextJS-Warmup-Proxy/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!backendRes.ok) {
      console.warn(`❌ Warmup failed: ${backendRes.status}`);
      return NextResponse.json(
        {
          status: "cold",
          error: `Warmup failed with status ${backendRes.status}`,
        },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    console.log(`✅ Warmup successful: ${data.status}`);
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("❌ Warmup proxy error:", error);

    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          status: "cold",
          error: "Warmup timeout",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        status: "cold",
        error: "Warmup service unavailable",
      },
      { status: 503 }
    );
  }
}