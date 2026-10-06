import type { NextRequest } from "next/server";
import { proxyPublicJson, readJsonBody } from "@/lib/api/proxyPublicJson";
import { verifyEmailRequestSchema } from "@/components/schemas/accountSchemas";

export async function POST(request: NextRequest) {
  return proxyPublicJson({
    backendPath: "/api/auth/verify-email",
    body: await readJsonBody(request),
    schema: verifyEmailRequestSchema,
  });
}
