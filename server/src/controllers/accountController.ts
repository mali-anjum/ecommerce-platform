import { Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError, NotFoundError } from "../utils/ApiError";
import { requireUserId } from "../utils/requireUserId";
import { createLogger } from "../utils/logger";
import { sentryTracker } from "../lib/monitoring";
import { isEmailConfigured } from "../config/email";
import {
  consumeAccountToken,
  issueAccountToken,
} from "../services/auth/accountTokenService";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../services/auth/accountEmails";
import type {
  ForgotPasswordBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from "../validations/accountSchema";

const logger = createLogger("ACCOUNT_CONTROLLER");

// Same response whether or not the account exists, so the endpoint cannot be used to discover emails.
const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

/** Sends a verification email; failures are reported but never break the caller (e.g. registration). */
export async function sendVerificationEmailSafely(user: {
  id: string;
  email: string;
  name: string | null;
}): Promise<boolean> {
  if (!isEmailConfigured()) {
    logger.warn("Email verification skipped: SMTP is not configured", { userId: user.id });
    return false;
  }
  try {
    const rawToken = await issueAccountToken(user.id, "EMAIL_VERIFICATION");
    await sendVerificationEmail(user, rawToken);
    return true;
  } catch (error) {
    sentryTracker(error, { source: "accountController.sendVerificationEmail" });
    logger.error("Failed to send verification email", { userId: user.id });
    return false;
  }
}

export const forgotPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { email } = req.validatedData as ForgotPasswordBody;

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (user?.isActive) {
      if (!isEmailConfigured()) {
        logger.warn("Password reset email skipped: SMTP is not configured", { userId: user.id });
      } else {
        try {
          const rawToken = await issueAccountToken(user.id, "PASSWORD_RESET");
          await sendPasswordResetEmail(user, rawToken);
        } catch (error) {
          // Still return the generic response; a different status would reveal that the account exists.
          sentryTracker(error, { source: "accountController.forgotPassword" });
          logger.error("Failed to send password reset email", { userId: user.id });
        }
      }
    }

    res.status(200).json(new ApiResponse(200, null, FORGOT_PASSWORD_MESSAGE));
  },
);

export const resetPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { token, password } = req.validatedData as ResetPasswordBody;
    const hashedPassword = await bcrypt.hash(password, 12);

    const userId = await consumeAccountToken(token, "PASSWORD_RESET", (tx, id) =>
      tx.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          // Signs out every existing session; the reset link also proves email ownership.
          refreshToken: null,
          emailVerified: true,
        },
      }),
    );

    if (!userId) {
      throw new ApiError(400, "This reset link is invalid or has expired. Please request a new one.");
    }

    logger.info("Password reset completed", { userId });
    res
      .status(200)
      .json(new ApiResponse(200, null, "Your password has been reset. Please sign in."));
  },
);

export const verifyEmail = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { token } = req.validatedData as VerifyEmailBody;

    const userId = await consumeAccountToken(token, "EMAIL_VERIFICATION", (tx, id) =>
      tx.user.update({ where: { id }, data: { emailVerified: true } }),
    );

    if (!userId) {
      throw new ApiError(
        400,
        "This verification link is invalid or has expired. Please request a new one.",
      );
    }

    res.status(200).json(new ApiResponse(200, null, "Your email address has been verified."));
  },
);

export const resendVerificationEmail = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const userId = requireUserId(req, "Authentication required");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, emailVerified: true },
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.emailVerified) {
      res
        .status(200)
        .json(new ApiResponse(200, { emailVerified: true }, "Your email is already verified."));
      return;
    }

    if (!isEmailConfigured()) {
      throw new ApiError(503, "Email service is not configured. Please try again later.");
    }

    const sent = await sendVerificationEmailSafely(user);
    if (!sent) {
      throw new ApiError(502, "Could not send the verification email. Please try again later.");
    }

    res
      .status(200)
      .json(new ApiResponse(200, { emailVerified: false }, "Verification email sent."));
  },
);
