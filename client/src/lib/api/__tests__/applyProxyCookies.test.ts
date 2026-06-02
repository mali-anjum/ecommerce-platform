import { NextResponse } from "next/server";
import { applyProxyCookies } from "../applyProxyCookies";

describe("applyProxyCookies", () => {
  it("applies cookies from backend Set-Cookie headers onto NextResponse", () => {
    const backendRes = new Response(null, {
      status: 200,
      headers: {
        "Set-Cookie": [
          "accessToken=eyJhbG; Path=/; HttpOnly; SameSite=Lax; Max-Age=900",
          "refreshToken=uuid; Domain=localhost; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800",
        ],
      },
    });

    const response = NextResponse.json({ ok: true });
    const applied = applyProxyCookies(response, backendRes);

    expect(applied).toBeGreaterThanOrEqual(1);
    expect(response.cookies.get("accessToken")?.value).toBe("eyJhbG");

    const refresh = response.cookies.get("refreshToken");
    if (refresh) {
      expect(refresh.value).toBe("uuid");
    }
  });
});
