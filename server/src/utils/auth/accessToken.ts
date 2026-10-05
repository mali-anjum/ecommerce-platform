import { jwtVerify } from "jose";

export type AccessTokenUser = {
  userId: string;
  email: string;
  role: string;
};

/** Encodes JWT_SECRET for jose; throws a clear error when it is not configured. */
export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

/** Reads the access token from the cookie, falling back to a Bearer header. */
export function extractAccessToken(
  cookies: Record<string, string> | undefined,
  authorization: string | undefined,
): string | undefined {
  const fromCookie = cookies?.accessToken;
  if (fromCookie) return fromCookie;

  // Raw tokens without the "Bearer " prefix are still accepted (existing contract).
  const token = authorization?.replace("Bearer ", "").trim();
  return token || undefined;
}

/** Verifies signature/expiry and requires the claims the app depends on. */
export async function verifyAccessToken(token: string): Promise<AccessTokenUser> {
  const { payload } = await jwtVerify(token, getJwtSecretKey(), {
    algorithms: ["HS256"],
  });

  const { userId, email, role } = payload;
  if (
    typeof userId !== "string" ||
    !userId ||
    typeof email !== "string" ||
    typeof role !== "string" ||
    !role
  ) {
    throw new Error("Access token is missing required claims");
  }

  return { userId, email, role };
}
