import type { OAuthProvider } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { OAuthProfileInput } from "./types";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function mapProviderId(provider: string): OAuthProvider | null {
  const normalized = provider.trim().toUpperCase();
  if (
    normalized === "GOOGLE" ||
    normalized === "FACEBOOK" ||
    normalized === "APPLE" ||
    normalized === "GITHUB" ||
    normalized === "MICROSOFT"
  ) {
    return normalized;
  }
  return null;
}

/**
 * Links OAuth identities to users and prevents duplicate accounts by email.
 */
export class OAuthAccountService {
  async findOrCreateUserFromOAuth(
    profile: OAuthProfileInput,
  ): Promise<{ userId: string; isNewUser: boolean }> {
    const email = normalizeEmail(profile.email);
    if (!email) {
      throw new Error("OAuth provider did not return an email address");
    }

    const existingAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: profile.provider,
          providerUserId: profile.providerUserId,
        },
      },
      select: { userId: true },
    });

    if (existingAccount) {
      await prisma.user.update({
        where: { id: existingAccount.userId },
        data: {
          lastLogin: new Date(),
          ...(profile.name ? { name: profile.name } : {}),
          ...(profile.image ? { image: profile.image } : {}),
          ...(profile.emailVerified ? { emailVerified: true } : {}),
        },
      });
      return { userId: existingAccount.userId, isNewUser: false };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      await prisma.$transaction([
        prisma.oAuthAccount.create({
          data: {
            userId: existingUser.id,
            provider: profile.provider,
            providerUserId: profile.providerUserId,
          },
        }),
        prisma.user.update({
          where: { id: existingUser.id },
          data: {
            lastLogin: new Date(),
            ...(profile.name ? { name: profile.name } : {}),
            ...(profile.image ? { image: profile.image } : {}),
            ...(profile.emailVerified ? { emailVerified: true } : {}),
          },
        }),
      ]);
      return { userId: existingUser.id, isNewUser: false };
    }

    const created = await prisma.user.create({
      data: {
        email,
        name: profile.name ?? email.split("@")[0],
        image: profile.image ?? null,
        password: null,
        role: "USER",
        emailVerified: profile.emailVerified ?? true,
        profileComplete: profile.profileComplete ?? false,
        oauthAccounts: {
          create: {
            provider: profile.provider,
            providerUserId: profile.providerUserId,
          },
        },
      },
      select: { id: true },
    });

    return { userId: created.id, isNewUser: true };
  }
}

export const oauthAccountService = new OAuthAccountService();
