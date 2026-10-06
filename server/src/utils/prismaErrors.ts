import { Prisma } from "@prisma/client";

/** True when Prisma could not find the record to update/delete (P2025). */
export function isPrismaNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
