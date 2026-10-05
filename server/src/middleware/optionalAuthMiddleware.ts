import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import { extractAccessToken, verifyAccessToken } from "../utils/auth/accessToken";

/**
 * Attaches `req.user` when a valid access token is present.
 * Does not reject unauthenticated requests (used by public AI chat with order-aware branches).
 */
export const optionalAuthenticateJwt = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessToken = extractAccessToken(
      req.cookies,
      req.headers.authorization,
    );

    if (!accessToken) {
      next();
      return;
    }

    req.user = await verifyAccessToken(accessToken);
  } catch {
    // Invalid token — treat as guest for mixed public/order chat flows.
  }

  next();
};
