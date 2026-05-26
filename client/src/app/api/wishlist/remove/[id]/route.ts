import { NextRequest } from "next/server";
import { proxyWithAuth } from "@/lib/api/proxyWithAuth";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyWithAuth(request, {
    method: "DELETE",
    backendPath: `/api/wishlist/remove/${id}`,
  });
}
