import type { NextRequest } from "next/server";
import { proxyWithAuth } from "@/lib/api/proxyWithAuth";

export async function POST(request: NextRequest) {
  return proxyWithAuth(request, {
    method: "POST",
    backendPath: "/api/auth/resend-verification",
  });
}
