import { extractSetCookieHeaders } from "../extractSetCookieHeaders";

describe("extractSetCookieHeaders", () => {
  it("returns cookies from getSetCookie()", () => {
    const backendRes = {
      headers: {
        getSetCookie: () => ["accessToken=x; Path=/", "refreshToken=y; Path=/"],
      },
    } as unknown as Response;
    expect(extractSetCookieHeaders(backendRes)).toEqual([
      "accessToken=x; Path=/",
      "refreshToken=y; Path=/",
    ]);
  });

  it("returns [] when getSetCookie is missing", () => {
    const backendRes = {
      headers: {},
    } as unknown as Response;
    expect(extractSetCookieHeaders(backendRes)).toEqual([]);
  });

  it("filters empty strings", () => {
    const backendRes = {
      headers: {
        getSetCookie: () => ["accessToken=z; Path=/", ""],
      },
    } as unknown as Response;
    expect(extractSetCookieHeaders(backendRes)).toEqual(["accessToken=z; Path=/"]);
  });
});
