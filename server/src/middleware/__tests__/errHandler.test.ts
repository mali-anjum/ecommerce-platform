import { redactSensitive } from "../errHandler";

describe("redactSensitive", () => {
  it("masks passwords and tokens at any depth", () => {
    expect(
      redactSensitive({
        email: "a@b.co",
        password: "secret12",
        token: "raw-token",
        nested: { refreshToken: "r", newPassword: "p", items: [{ cardNumber: "4242" }] },
      })
    ).toEqual({
      email: "a@b.co",
      password: "[REDACTED]",
      token: "[REDACTED]",
      nested: { refreshToken: "[REDACTED]", newPassword: "[REDACTED]", items: [{ cardNumber: "[REDACTED]" }] },
    });
  });

  it("leaves primitives and non-sensitive fields untouched", () => {
    expect(redactSensitive(undefined)).toBeUndefined();
    expect(redactSensitive("text")).toBe("text");
    expect(redactSensitive({ page: "2", q: "shoes" })).toEqual({ page: "2", q: "shoes" });
  });
});
