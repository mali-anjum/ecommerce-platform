import { API_ROUTES } from "@/lib/routes/api";
import { isModuleEnabled } from "@/lib/feature-flags";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isModuleEnabled("ai")) {
    return NextResponse.json(
      { success: false, message: "AI module is disabled for this client" },
      { status: 403 },
    );
  }

  try {
    const backendRes = await fetch(`${API_ROUTES.AI}/faq`, {
      cache: "no-store",
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("FAQ proxy failed", error);
    return NextResponse.json(
      { success: false, message: "Failed to load FAQ" },
      { status: 500 },
    );
  }
}
