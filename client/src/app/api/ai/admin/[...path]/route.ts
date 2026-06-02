import type { NextRequest } from "next/server";
import { proxyAdminAiRequest } from "@/lib/api/proxyAdminAiRequest";

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(
  request: NextRequest,
  context: RouteContext,
  method: string,
) {
  const { path } = await context.params;
  return proxyAdminAiRequest(request, path, method);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handle(request, context, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context, "POST");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handle(request, context, "PATCH");
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handle(request, context, "PUT");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handle(request, context, "DELETE");
}
