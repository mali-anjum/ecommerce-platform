import { AxiosError, AxiosHeaders } from "axios";
import { getApiErrorMessage } from "../accountApi";
import {
  forgotPasswordSchema,
  resetPasswordFormSchema,
  resetPasswordRequestSchema,
} from "@/components/schemas/accountSchemas";

function axiosError(status: number, data: unknown): AxiosError {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe("getApiErrorMessage", () => {
  it("prefers the first field error from a validation response", () => {
    const err = axiosError(400, {
      message: "Validation failed",
      errors: [{ field: "password", message: "Password must be at least 6 characters" }],
    });
    expect(getApiErrorMessage(err, "fallback")).toBe("Password must be at least 6 characters");
  });

  it("uses the express ApiError message", () => {
    const err = axiosError(400, { success: false, message: "This reset link is invalid or has expired." });
    expect(getApiErrorMessage(err, "fallback")).toBe("This reset link is invalid or has expired.");
  });

  it("uses the auth-style error field", () => {
    expect(getApiErrorMessage(axiosError(401, { error: "Unauthorized" }), "fallback")).toBe(
      "Unauthorized",
    );
  });

  it("returns a friendly message for rate limiting", () => {
    expect(getApiErrorMessage(axiosError(429, { error: "Too many" }), "fallback")).toMatch(
      /Too many attempts/,
    );
  });

  it("falls back for non-axios errors and empty bodies", () => {
    expect(getApiErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
    expect(getApiErrorMessage(axiosError(500, {}), "fallback")).toBe("fallback");
  });
});

describe("account form schemas", () => {
  it("requires matching passwords on the reset form", () => {
    const result = resetPasswordFormSchema.safeParse({
      password: "secret12",
      confirmPassword: "secret13",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("accepts matching passwords", () => {
    expect(
      resetPasswordFormSchema.safeParse({ password: "secret12", confirmPassword: "secret12" }).success,
    ).toBe(true);
  });

  it("mirrors the server password bounds (6–72)", () => {
    const token = "a".repeat(43);
    expect(resetPasswordRequestSchema.safeParse({ token, password: "12345" }).success).toBe(false);
    expect(resetPasswordRequestSchema.safeParse({ token, password: "x".repeat(73) }).success).toBe(false);
    expect(resetPasswordRequestSchema.safeParse({ token, password: "x".repeat(72) }).success).toBe(true);
  });

  it("validates and trims the forgot-password email", () => {
    expect(forgotPasswordSchema.parse({ email: " a@b.co " })).toEqual({ email: "a@b.co" });
    expect(forgotPasswordSchema.safeParse({ email: "a@" }).success).toBe(false);
  });
});
