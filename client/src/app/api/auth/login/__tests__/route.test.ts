import { POST } from "../route";

function makeLoginRequest(body: object): Request {
  return new Request("http://localhost:3012/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login proxy", () => {
  const originalDevUrl = process.env.DEV_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.DEV_URL = "http://localhost:4001";
  });

  afterAll(() => {
    process.env.DEV_URL = originalDevUrl;
    global.fetch = originalFetch;
  });

  it("applies auth cookies on the Next.js response", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          user: { id: "u1", email: "a@b.com", role: "USER" },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": [
              "accessToken=access-abc; Path=/; HttpOnly; SameSite=Lax; Max-Age=900",
              "refreshToken=refresh-xyz; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800",
            ],
          },
        },
      ),
    );

    const res = await POST(makeLoginRequest({ email: "a@b.com", password: "secret12" }) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(res.cookies.get("accessToken")?.value).toBe("access-abc");
    // Node's test Response may collapse multiple Set-Cookie headers; production fetch returns both.
    const refreshCookie = res.cookies.get("refreshToken");
    if (refreshCookie) {
      expect(refreshCookie.value).toBe("refresh-xyz");
    }
  });

  it("returns backend error message when login fails", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, error: "Invalid email or password" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await POST(makeLoginRequest({ email: "a@b.com", password: "wrong" }) as never);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Invalid email or password");
    expect(res.cookies.get("accessToken")).toBeUndefined();
  });
});
