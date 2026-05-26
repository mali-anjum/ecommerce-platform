import { NextRequest } from "next/server";
import { proxyWithAuth } from "@/lib/api/proxyWithAuth";

export async function GET(request: NextRequest) {
  return proxyWithAuth(request, {
    method: "GET",
    backendPath: "/api/wishlist",
  });
}
