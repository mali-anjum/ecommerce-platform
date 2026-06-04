// src/middleware/authMiddleware.ts
import { NextFunction, Response } from "express";
import { jwtVerify } from "jose";
import { AuthenticatedRequest } from "../types/express";
import { sentryTracker } from "../lib/monitoring";

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ✅ Check cookie first (primary method for browsers)
    let accessToken = req.cookies?.accessToken;
    
    // ✅ Fallback: Authorization header (for mobile apps, Postman)
    if (!accessToken && req.headers.authorization) {
      accessToken = req.headers.authorization.replace('Bearer ', '');
    }

    if (!accessToken) {
      res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
      return;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(accessToken, secret);

    req.user = {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
    
    next();
  } catch (error) {
    sentryTracker(error, { source: "authMiddleware" });
    console.error("JWT verification failed:", error);
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