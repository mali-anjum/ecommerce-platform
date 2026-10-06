import type { NextRequest } from "next/server";
import { proxyPublicJson, readJsonBody } from "@/lib/api/proxyPublicJson";
import { resetPasswordRequestSchema } from "@/components/schemas/accountSchemas";

export async function POST(request: NextRequest) {
  return proxyPublicJson({
    backendPath: "/api/auth/reset-password",
    body: await readJsonBody(request),
    schema: resetPasswordRequestSchema,
  });
}
