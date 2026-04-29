import { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthenticatedRequest } from "../types/express";

export const requireSellerOrSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const role = req.user?.role;
  if (!req.user) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }
  if (role === "SUPER_ADMIN" || role === "SELLER") {
    next();
    return;
  }
  res.status(403).json({
    success: false,
    error: "Seller or super-admin access required",
  });
};

/** For seller-only routes: loads `req.sellerProfile.id` from DB (super-admin bypasses); responds 401/403 if missing. */
export const attachSellerProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }
  if (req.user.role === "SUPER_ADMIN") {
    next();
    return;
  }
  if (req.user.role === "SELLER") {
    // Returns { id: string } if this user has a Seller row, else null (no row = not onboarded as seller).
    const seller = await prisma.seller.findUnique({
      where: { userId: req.user.userId },
      select: { id: true },
    });
    if (!seller) {
      res.status(403).json({
        success: false,
        error:
          "Seller profile not found. Complete seller onboarding before managing products.",
      });
      return;
    }
    req.sellerProfile = { id: seller.id };
    next();
    return;
  }
  res.status(403).json({ success: false, error: "Forbidden" });
};
