import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../types/express";

const findFirstMock = jest.fn();
const findUniqueMock = jest.fn();
const isEmailConfiguredMock = jest.fn();
const issueAccountTokenMock = jest.fn();
const consumeAccountTokenMock = jest.fn();
const sendPasswordResetEmailMock = jest.fn();
const sendVerificationEmailMock = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));
jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../config/email", () => ({
  isEmailConfigured: () => isEmailConfiguredMock(),
}));
jest.mock("../../services/auth/accountTokenService", () => ({
  issueAccountToken: (...args: unknown[]) => issueAccountTokenMock(...args),
  consumeAccountToken: (...args: unknown[]) => consumeAccountTokenMock(...args),
}));
jest.mock("../../services/auth/accountEmails", () => ({
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmailMock(...args),
  sendVerificationEmail: (...args: unknown[]) => sendVerificationEmailMock(...args),
}));
jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: { hash: jest.fn(async (pw: string) => `hashed:${pw}`) },
}));

import {
  forgotPassword,
  resendVerificationEmail,
  resetPassword,
  sendVerificationEmailSafely,
  verifyEmail,
} from "../accountController";

type Handler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => unknown;
type Outcome = { status?: number; body?: { success?: boolean; message?: string; data?: unknown }; error?: { statusCode?: number; message?: string } };

/** Runs an asyncHandler-wrapped controller and resolves with the response or the forwarded error. */
function run(handler: Handler, req: Partial<AuthenticatedRequest>): Promise<Outcome> {
  return new Promise((resolve) => {
    const outcome: Outcome = {};
    const res = {
      status: jest.fn((code: number) => {
        outcome.status = code;
        return res;
      }),
      json: jest.fn((body: Outcome["body"]) => {
        outcome.body = body;
        resolve(outcome);
        return res;
      }),
    } as unknown as Response;
    const next = ((err?: Outcome["error"]) => resolve({ error: err })) as NextFunction;
    handler(req as AuthenticatedRequest, res, next);
  });
}

const GENERIC = "If an account exists for that email, a password reset link has been sent.";
const user = { id: "user-1", email: "shopper@example.com", name: "Shopper", isActive: true };

beforeEach(() => {
  jest.clearAllMocks();
  isEmailConfiguredMock.mockReturnValue(true);
  issueAccountTokenMock.mockResolvedValue("raw-token-value");
  sendPasswordResetEmailMock.mockResolvedValue(undefined);
  sendVerificationEmailMock.mockResolvedValue(undefined);
});

describe("forgotPassword", () => {
  it("emails a reset link to an active account and returns the generic message", async () => {
    findFirstMock.mockResolvedValue(user);

    const out = await run(forgotPassword, { validatedData: { email: "Shopper@Example.com" } });

    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ success: true, message: GENERIC });
    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: "Shopper@Example.com", mode: "insensitive" } },
      }),
    );
    expect(issueAccountTokenMock).toHaveBeenCalledWith("user-1", "PASSWORD_RESET");
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(user, "raw-token-value");
  });

  it("returns the identical response for an unknown email without sending anything", async () => {
    findFirstMock.mockResolvedValue(null);

    const out = await run(forgotPassword, { validatedData: { email: "nobody@example.com" } });

    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ success: true, message: GENERIC });
    expect(issueAccountTokenMock).not.toHaveBeenCalled();
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });

  it("does not send a reset link to a deactivated account", async () => {
    findFirstMock.mockResolvedValue({ ...user, isActive: false });

    const out = await run(forgotPassword, { validatedData: { email: user.email } });

    expect(out.body).toMatchObject({ message: GENERIC });
    expect(issueAccountTokenMock).not.toHaveBeenCalled();
  });

  it("still returns the generic 200 when the mail server fails (no account enumeration)", async () => {
    findFirstMock.mockResolvedValue(user);
    sendPasswordResetEmailMock.mockRejectedValue(new Error("SMTP down"));

    const out = await run(forgotPassword, { validatedData: { email: user.email } });

    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ success: true, message: GENERIC });
  });

  it("skips token creation when SMTP is not configured", async () => {
    findFirstMock.mockResolvedValue(user);
    isEmailConfiguredMock.mockReturnValue(false);

    const out = await run(forgotPassword, { validatedData: { email: user.email } });

    expect(out.body).toMatchObject({ message: GENERIC });
    expect(issueAccountTokenMock).not.toHaveBeenCalled();
  });
});

describe("resetPassword", () => {
  it("hashes the new password, signs out all sessions, and marks the email verified", async () => {
    const txUpdate = jest.fn();
    consumeAccountTokenMock.mockImplementation(async (_token, _type, onConsumed) => {
      await onConsumed({ user: { update: txUpdate } }, "user-1");
      return "user-1";
    });

    const out = await run(resetPassword, {
      validatedData: { token: "raw-token-value", password: "new-password" },
    });

    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ success: true });
    expect(consumeAccountTokenMock).toHaveBeenCalledWith(
      "raw-token-value",
      "PASSWORD_RESET",
      expect.any(Function),
    );
    expect(txUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "hashed:new-password", refreshToken: null, emailVerified: true },
    });
  });

  it("rejects an invalid, expired, or used token with 400", async () => {
    consumeAccountTokenMock.mockResolvedValue(null);

    const out = await run(resetPassword, {
      validatedData: { token: "bad-token-value-xxxxxxxx", password: "new-password" },
    });

    expect(out.error?.statusCode).toBe(400);
    expect(out.error?.message).toMatch(/invalid or has expired/);
  });
});

describe("verifyEmail", () => {
  it("marks the user's email as verified", async () => {
    const txUpdate = jest.fn();
    consumeAccountTokenMock.mockImplementation(async (_token, _type, onConsumed) => {
      await onConsumed({ user: { update: txUpdate } }, "user-1");
      return "user-1";
    });

    const out = await run(verifyEmail, { validatedData: { token: "raw-token-value" } });

    expect(out.status).toBe(200);
    expect(consumeAccountTokenMock).toHaveBeenCalledWith(
      "raw-token-value",
      "EMAIL_VERIFICATION",
      expect.any(Function),
    );
    expect(txUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { emailVerified: true },
    });
  });

  it("rejects an invalid or expired token with 400", async () => {
    consumeAccountTokenMock.mockResolvedValue(null);

    const out = await run(verifyEmail, { validatedData: { token: "raw-token-value" } });

    expect(out.error?.statusCode).toBe(400);
  });
});

describe("resendVerificationEmail", () => {
  it("returns 401 without an authenticated user", async () => {
    const out = await run(resendVerificationEmail, {});

    expect(out.error?.statusCode).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("uses the authenticated user id, never the request body", async () => {
    findUniqueMock.mockResolvedValue({ ...user, emailVerified: false });

    await run(resendVerificationEmail, {
      user: { userId: "user-1", email: user.email, role: "USER" },
      body: { userId: "someone-else" },
    });

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } }),
    );
  });

  it("does not send when the email is already verified", async () => {
    findUniqueMock.mockResolvedValue({ ...user, emailVerified: true });

    const out = await run(resendVerificationEmail, {
      user: { userId: "user-1", email: user.email, role: "USER" },
    });

    expect(out.status).toBe(200);
    expect(out.body?.data).toEqual({ emailVerified: true });
    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });

  it("sends a new verification email when unverified", async () => {
    findUniqueMock.mockResolvedValue({ ...user, emailVerified: false });

    const out = await run(resendVerificationEmail, {
      user: { userId: "user-1", email: user.email, role: "USER" },
    });

    expect(out.status).toBe(200);
    expect(issueAccountTokenMock).toHaveBeenCalledWith("user-1", "EMAIL_VERIFICATION");
    expect(sendVerificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: user.email }),
      "raw-token-value",
    );
  });

  it("returns 404 when the user no longer exists", async () => {
    findUniqueMock.mockResolvedValue(null);

    const out = await run(resendVerificationEmail, {
      user: { userId: "user-1", email: user.email, role: "USER" },
    });

    expect(out.error?.statusCode).toBe(404);
  });

  it("returns 503 when SMTP is not configured", async () => {
    findUniqueMock.mockResolvedValue({ ...user, emailVerified: false });
    isEmailConfiguredMock.mockReturnValue(false);

    const out = await run(resendVerificationEmail, {
      user: { userId: "user-1", email: user.email, role: "USER" },
    });

    expect(out.error?.statusCode).toBe(503);
  });

  it("returns 502 when the mail server fails", async () => {
    findUniqueMock.mockResolvedValue({ ...user, emailVerified: false });
    sendVerificationEmailMock.mockRejectedValue(new Error("SMTP down"));

    const out = await run(resendVerificationEmail, {
      user: { userId: "user-1", email: user.email, role: "USER" },
    });

    expect(out.error?.statusCode).toBe(502);
  });
});

describe("sendVerificationEmailSafely", () => {
  it("never throws when sending fails (registration must not break)", async () => {
    sendVerificationEmailMock.mockRejectedValue(new Error("SMTP down"));

    await expect(sendVerificationEmailSafely(user)).resolves.toBe(false);
  });

  it("returns true after issuing a token and sending", async () => {
    await expect(sendVerificationEmailSafely(user)).resolves.toBe(true);
    expect(issueAccountTokenMock).toHaveBeenCalledWith("user-1", "EMAIL_VERIFICATION");
  });
});
