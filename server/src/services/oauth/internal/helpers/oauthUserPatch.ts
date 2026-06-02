import type { Prisma } from "@prisma/client";
import type { OAuthProfileInput } from "../types";

type CurrentUserProfile = {
  name: string | null;
  image: string | null;
  emailVerified: boolean;
};

/**
 * Builds a safe user patch from an OAuth profile.
 *
 * Rules:
 * - never overwrite user-controlled fields (`name`, `image`) once set
 * - only mark `emailVerified` true when provider explicitly verified it
 */
export function buildOAuthUserPatch(
  profile: Pick<OAuthProfileInput, "name" | "image" | "emailVerified">,
  current: CurrentUserProfile | null | undefined,
): Prisma.UserUpdateInput {
  const shouldSetName =
    Boolean(profile.name?.trim()) && !current?.name?.trim();
  const shouldSetImage =
    Boolean(profile.image?.trim()) && !current?.image?.trim();
  const shouldSetEmailVerified =
    profile.emailVerified === true && current?.emailVerified !== true;

  return {
    ...(shouldSetName ? { name: profile.name } : {}),
    ...(shouldSetImage ? { image: profile.image } : {}),
    ...(shouldSetEmailVerified ? { emailVerified: true } : {}),
  };
}

