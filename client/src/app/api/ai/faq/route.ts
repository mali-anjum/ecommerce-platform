import { API_ROUTES } from "@/lib/routes/api";
import { NextResponse } from "next/server";

export async function GET() {
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
