import { Prisma } from "@prisma/client";
import { extractAxiosAuthError, mapAuthErrorResponse } from "../authErrors";

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("db failure on host 10.0.0.5", {
    code,
    clientVersion: "test",
  });
}

describe("mapAuthErrorResponse", () => {
  it("maps a unique-constraint violation to a 400 duplicate-email message", () => {
    expect(mapAuthErrorResponse(prismaError("P2002"))).toEqual({
      status: 400,
      error: "User with this email already exists",
    });
  });

  it("maps a missing-column error to 503", () => {
    expect(mapAuthErrorResponse(prismaError("P2022")).status).toBe(503);
  });

  it("maps an unreachable database to 503", () => {
    expect(mapAuthErrorResponse(prismaError("P1001"))).toEqual({
      status: 503,
      error: "Database is unavailable. Please try again in a moment.",
    });
  });

  it("returns a generic 500 for other Prisma errors without leaking the message", () => {
    const result = mapAuthErrorResponse(prismaError("P2025"));
    expect(result).toEqual({ status: 500, error: "Something went wrong. Please try again." });
    expect(result.error).not.toContain("10.0.0.5");
  });

  it("does not echo raw messages from generic errors", () => {
    const result = mapAuthErrorResponse(new Error("relation \"User\" does not exist"));
    expect(result).toEqual({ status: 500, error: "Something went wrong. Please try again." });
  });

  it("handles non-Error values", () => {
    expect(mapAuthErrorResponse("boom").status).toBe(500);
    expect(mapAuthErrorResponse(undefined).status).toBe(500);
  });
});

describe("extractAxiosAuthError", () => {
  it("prefers the error field", () => {
    expect(extractAxiosAuthError({ error: "Bad creds", message: "x" }, "fallback")).toBe("Bad creds");
  });

  it("falls back to the message field", () => {
    expect(extractAxiosAuthError({ message: "Locked" }, "fallback")).toBe("Locked");
  });

  it("ignores blank and non-string fields", () => {
    expect(extractAxiosAuthError({ error: "  ", message: 5 }, "fallback")).toBe("fallback");
  });

  it("returns the fallback for non-object payloads", () => {
    expect(extractAxiosAuthError(null, "fallback")).toBe("fallback");
    expect(extractAxiosAuthError("text", "fallback")).toBe("fallback");
  });
});
