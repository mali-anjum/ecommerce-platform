import { UnauthorizedError } from "./ApiError";
import type { AuthenticatedRequest } from "../types/express";

/**
 * Returns the authenticated user's id or throws UnauthorizedError (401).
 * Use in controllers behind authenticateJwt / asyncHandler.
 */
export function requireUserId(
  req: AuthenticatedRequest,
  message = "Unauthorized user"
): string {
  const userId = req.user?.userId;
  if (!userId) {
    throw new UnauthorizedError(message);
  }
  return userId;
}
