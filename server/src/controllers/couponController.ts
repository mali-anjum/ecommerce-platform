import { Response } from "express";
import { Prisma } from "@prisma/client";
import { AuthenticatedRequest } from "../types/express";
import { prisma } from "../lib/prisma";
import { sentryTracker } from "../lib/monitoring";
import { getCouponRejection } from "../services/coupon/couponRules";
import type { CreateCouponInput } from "../validations/couponSchema";

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

const createCoupon = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Parsed and range-checked by `validate(createCouponSchema)` on the route.
    const { code, discountPercent, startDate, endDate, usageLimit } =
      req.validatedData as CreateCouponInput;

    const newlyCreatedCoupon = await prisma.coupon.create({
      data: {
        code,
        discountPercent,
        startDate,
        endDate,
        usageLimit,
        usageCount: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully!",
      coupon: newlyCreatedCoupon,
    });
  } catch (e) {
    if (isPrismaError(e, "P2002")) {
      res.status(409).json({ success: false, message: "A coupon with this code already exists" });
      return;
    }
    sentryTracker(e, { source: "couponController" });
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to created coupon",
    });
  }
};

const fetchAllCoupons = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const fetchAllCouponsList = await prisma.coupon.findMany({
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json({
      success: true,
      message: "Coupons fetched successfully",
      couponList: fetchAllCouponsList,
    });
  } catch (e) {
    sentryTracker(e, { source: "couponController" });
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupon list",
    });
  }
};

/** Shoppers check a single code; the full coupon list is admin-only. */
const validateCoupon = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { code } = req.validatedData as { code: string };
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon) {
      res.status(404).json({ success: false, message: "Invalid coupon code" });
      return;
    }

    const rejection = getCouponRejection(coupon);
    if (rejection) {
      res.status(400).json({ success: false, message: rejection });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Coupon is valid",
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        endDate: coupon.endDate,
        minOrderValue: coupon.minOrderValue,
      },
    });
  } catch (e) {
    sentryTracker(e, { source: "couponController" });
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to validate coupon" });
  }
};

const deleteCoupon = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.coupon.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully!",
      id: id,
    });
  } catch (e) {
    if (isPrismaError(e, "P2025")) {
      res.status(404).json({ success: false, message: "Coupon not found" });
      return;
    }
    sentryTracker(e, { source: "couponController" });
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};

export {
  createCoupon,
  fetchAllCoupons,
  validateCoupon,
  deleteCoupon
}
