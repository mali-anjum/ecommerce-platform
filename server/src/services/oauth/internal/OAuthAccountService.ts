import type { OAuthProvider } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import type { OAuthProfileInput } from "./types";
import { buildOAuthUserPatch } from "./helpers/oauthUserPatch";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
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
      const current = await prisma.user.findUnique({
        where: { id: existingAccount.userId },
        select: { name: true, image: true, emailVerified: true },
      });

      await prisma.user.update({
        where: { id: existingAccount.userId },
        data: {
          lastLogin: new Date(),
          ...buildOAuthUserPatch(profile, current),
        },
      });
      return { userId: existingAccount.userId, isNewUser: false };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, image: true, emailVerified: true },
    });

    if (existingUser) {
      // Security: only link by email if the provider asserts the email is verified.
      if (profile.emailVerified !== true) {
        throw new Error(
          "OAuth provider did not verify this email address; cannot link accounts by email.",
        );
      }

      try {
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
              ...buildOAuthUserPatch(profile, existingUser),
            },
          }),
        ]);
      } catch (error) {
        // Race: another request linked this provider identity first.
        if (isUniqueConstraintError(error)) {
          const linked = await prisma.oAuthAccount.findUnique({
            where: {
              provider_providerUserId: {
                provider: profile.provider,
                providerUserId: profile.providerUserId,
              },
            },
            select: { userId: true },
          });
          if (linked) return { userId: linked.userId, isNewUser: false };
        }
        throw error;
      }
      return { userId: existingUser.id, isNewUser: false };
    }

    try {
      const created = await prisma.user.create({
        data: {
          email,
          name: profile.name ?? email.split("@")[0],
          image: profile.image ?? null,
          password: null,
          role: "USER",
          emailVerified: profile.emailVerified === true,
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
    } catch (error) {
      // Handle races: user created by email, or oauth account created by provider id.
      if (isUniqueConstraintError(error)) {
        const account = await prisma.oAuthAccount.findUnique({
          where: {
            provider_providerUserId: {
              provider: profile.provider,
              providerUserId: profile.providerUserId,
            },
          },
          select: { userId: true },
        });
        if (account) return { userId: account.userId, isNewUser: false };

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, image: true, emailVerified: true },
        });

        if (user && profile.emailVerified === true) {
          // Try linking to existing user (same rules as above).
          try {
            await prisma.oAuthAccount.create({
              data: {
                userId: user.id,
                provider: profile.provider,
                providerUserId: profile.providerUserId,
              },
            });
          } catch (linkError) {
            if (!isUniqueConstraintError(linkError)) throw linkError;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLogin: new Date(),
              ...buildOAuthUserPatch(profile, user),
            },
          });

          return { userId: user.id, isNewUser: false };
        }
      }

      throw error;
    }
  }
}

export const oauthAccountService = new OAuthAccountService();
