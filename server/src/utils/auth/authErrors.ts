import { Prisma } from "@prisma/client";

/**
 * Maps auth-related errors to safe, user-facing API messages.
 */
export function mapAuthErrorResponse(error: unknown): {
  status: number;
  error: string;
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return { status: 400, error: "User with this email already exists" };
    }
    if (error.code === "P2022") {
      return {
        status: 503,
        error:
          "Registration is temporarily unavailable. Please try again later or contact support.",
      };
    }
    if (error.code === "P1001") {
      return {
        status: 503,
        error: "Database is unavailable. Please try again in a moment.",
      };
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return { status: 500, error: error.message };
  }

  return { status: 500, error: "Something went wrong. Please try again." };
}

export function extractAxiosAuthError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.error === "string" && record.error.trim()) return record.error;
  if (typeof record.message === "string" && record.message.trim()) return record.message;
  return fallback;
}
