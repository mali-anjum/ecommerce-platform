import { requireUserId } from "../requireUserId";
import { UnauthorizedError } from "../ApiError";
import type { AuthenticatedRequest } from "../../types/express";

function mockReq(user: AuthenticatedRequest["user"]): AuthenticatedRequest {
  return { user } as AuthenticatedRequest;
}

describe("requireUserId", () => {
  it("returns userId when present", () => {
    expect(
      requireUserId(
        mockReq({
          userId: "user-1",
          email: "a@b.com",
          role: "USER",
        })
      )
    ).toBe("user-1");
  });

  it("throws UnauthorizedError when userId is missing", () => {
    expect(() => requireUserId(mockReq(undefined))).toThrow(UnauthorizedError);
  });

  it("uses custom message when provided", () => {
    try {
      requireUserId(mockReq(undefined), "Unauthenticated user");
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect((error as UnauthorizedError).message).toBe("Unauthenticated user");
    }
  });
});
