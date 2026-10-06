import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { getServerBackendUrl } from "@/lib/api/getServerBackendUrl";
import { sentryTracker } from "@/lib/monitoring";

type PublicProxyOptions = {
  backendPath: string;
  body: unknown;
  schema: ZodType;
};

/**
 * Validates a JSON body and forwards it to a public (no-auth) Express endpoint.
 * Passes the backend status and body through unchanged; never forwards cookies.
 */
export async function proxyPublicJson({ backendPath, body, schema }: PublicProxyOptions) {
  const BACKEND_URL = getServerBackendUrl();
  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const backendRes = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: controller.signal,
    });
    // 204/205/304 cannot carry a body; NextResponse.json would throw for them.
    if ([204, 205, 304].includes(backendRes.status)) {
      return new NextResponse(null, { status: backendRes.status });
    }
    const data = await backendRes.json().catch(() => ({ success: backendRes.ok }));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ success: false, error: "Request timeout" }, { status: 504 });
    }
    sentryTracker(error, { source: "proxyPublicJson", route: backendPath, method: "POST" });
    return NextResponse.json(
      { success: false, error: "Service temporarily unavailable" },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Reads a JSON request body, returning undefined for empty or malformed input. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
