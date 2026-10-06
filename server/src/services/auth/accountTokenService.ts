import crypto from "crypto";
import type { AccountTokenType } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export const ACCOUNT_TOKEN_TTL_MS: Record<AccountTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 30 * 60 * 1000,
};

// Prisma's 2s default wait is too short for a remote (e.g. Neon) database with high latency.
const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 15_000 };

export function hashAccountToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Creates a new single-use token and returns the raw value (sent by email only).
 * Any earlier unused token of the same type is invalidated so only the latest link works.
 */
export async function issueAccountToken(
  userId: string,
  type: AccountTokenType,
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("base64url");

  await prisma.$transaction([
    prisma.accountToken.deleteMany({ where: { userId, type, usedAt: null } }),
    prisma.accountToken.create({
      data: {
        userId,
        type,
        tokenHash: hashAccountToken(rawToken),
        expiresAt: new Date(Date.now() + ACCOUNT_TOKEN_TTL_MS[type]),
      },
    }),
  ]);

  return rawToken;
}

/**
 * Marks the token used and applies `onConsumed` in the same transaction.
 * Returns the user id, or null when the token is unknown, expired, already used, or of another type.
 */
export async function consumeAccountToken(
  rawToken: string,
  type: AccountTokenType,
  onConsumed: (
    tx: Pick<typeof prisma, "user" | "accountToken">,
    userId: string,
  ) => Promise<unknown>,
): Promise<string | null> {
  const tokenHash = hashAccountToken(rawToken);

  return prisma.$transaction(async (tx) => {
    const token = await tx.accountToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, type: true, usedAt: true, expiresAt: true },
    });

    if (!token || token.type !== type || token.usedAt || token.expiresAt <= new Date()) {
      return null;
    }

    // Conditional update makes concurrent use of the same link succeed at most once.
    const claimed = await tx.accountToken.updateMany({
      where: { id: token.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) {
      return null;
    }

    await onConsumed(tx, token.userId);
    return token.userId;
  }, TRANSACTION_OPTIONS);
}
