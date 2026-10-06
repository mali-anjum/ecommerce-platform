import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../accountSchema";

const token = "A".repeat(43);

describe("forgotPasswordSchema", () => {
  it("accepts and trims a valid email", () => {
    expect(forgotPasswordSchema.parse({ email: "  user@example.com " })).toEqual({
      email: "user@example.com",
    });
  });

  it.each([{}, { email: "" }, { email: "not-an-email" }, { email: 42 }])(
    "rejects %p",
    (body) => {
      expect(forgotPasswordSchema.safeParse(body).success).toBe(false);
    },
  );
});

describe("resetPasswordSchema", () => {
  it("accepts a valid token and password", () => {
    expect(resetPasswordSchema.safeParse({ token, password: "secret12" }).success).toBe(true);
  });

  it.each([
    ["short password", { token, password: "12345" }],
    ["password over bcrypt limit", { token, password: "x".repeat(73) }],
    ["short token", { token: "abc", password: "secret12" }],
    ["oversized token", { token: "A".repeat(201), password: "secret12" }],
    ["missing token", { password: "secret12" }],
    ["missing password", { token }],
  ])("rejects %s", (_label, body) => {
    expect(resetPasswordSchema.safeParse(body).success).toBe(false);
  });
});

describe("verifyEmailSchema", () => {
  it("accepts a token", () => {
    expect(verifyEmailSchema.safeParse({ token }).success).toBe(true);
  });

  it("rejects a missing or short token", () => {
    expect(verifyEmailSchema.safeParse({}).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ token: "short" }).success).toBe(false);
  });
});
