import { NextFunction, Response } from "express";
import { jwtVerify } from "jose";
import { AuthenticatedRequest } from "../types/express";

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
    let accessToken = req.cookies?.accessToken;

    if (!accessToken && req.headers.authorization) {
      accessToken = req.headers.authorization.replace("Bearer ", "");
    }

    if (!accessToken) {
      next();
      return;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(accessToken, secret);

    req.user = {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    // Invalid token — treat as guest for mixed public/order chat flows.
  }

  next();
};
