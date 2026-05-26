import { NextRequest } from "next/server";
import { proxyWithAuth } from "@/lib/api/proxyWithAuth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyWithAuth(request, {
    method: "POST",
    backendPath: "/api/wishlist/toggle",
    body,
  });
}
