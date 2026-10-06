import type { NextRequest } from "next/server";
import { proxyPublicJson, readJsonBody } from "@/lib/api/proxyPublicJson";
import { forgotPasswordSchema } from "@/components/schemas/accountSchemas";

export async function POST(request: NextRequest) {
  return proxyPublicJson({
    backendPath: "/api/auth/forgot-password",
    body: await readJsonBody(request),
    schema: forgotPasswordSchema,
  });
}
