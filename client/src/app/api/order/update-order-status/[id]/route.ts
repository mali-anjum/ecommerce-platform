import { API_ROUTES } from "@/utils/routes/api";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken)
      return NextResponse.json(
        { success: true, error: "Unauthenticated" },
        { status: 401 },
      );
      const {id} = await params;
      const status = await request.json();

      const backendRes = await fetch(`${API_ROUTES.ORDER}/${id}/status`,{
        method: "PUT", 
        headers: {
            "Content-Type": "application/json", 
            "Cookie": `accessToken=${accessToken}; refreshToken=${refreshToken}`
        },
        body: JSON.stringify(status)
      } );

      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status })

  } catch (error) {
    console.log(
      "Error occured while updating the status of the product",
      error,
    );
    return NextResponse.json(
      { success: false, error: "Error updating order status" },
      { status: 500 },
    );
  }
}
