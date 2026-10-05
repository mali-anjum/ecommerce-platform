// src/middleware/authMiddleware.ts
import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import { sentryTracker } from "../lib/monitoring";
import { extractAccessToken, verifyAccessToken } from "../utils/auth/accessToken";

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Cookie first (browsers), then Authorization header (mobile apps, Postman).
    const accessToken = extractAccessToken(
      req.cookies,
      req.headers.authorization
    );

    if (!accessToken) {
      res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
      return;
    }

    req.user = await verifyAccessToken(accessToken);
    
    next();
  } catch (error) {
    sentryTracker(error, { source: "authMiddleware" });
    console.error(
      "JWT verification failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    res.status(401).json({ 
      success: false, 
      error: "Invalid or expired token" 
    });
  }
};

export const isSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === "SUPER_ADMIN") {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: "Access denied! Super admin access required",
    });
  }
};