import type { OAuthProvider } from "@prisma/client";

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

