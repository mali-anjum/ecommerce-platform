import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import { prisma } from "../lib/prisma";
import { sentryTracker } from "../lib/monitoring";

const createCoupon = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { code, discountPercent, startDate, endDate, usageLimit } = req.body;

    const newlyCreatedCoupon = await prisma.coupon.create({
      data: {
        code,
        discountPercent: parseInt(discountPercent),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit: parseInt(usageLimit),
        usageCount: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully!",
      coupon: newlyCreatedCoupon,
    });
  } catch (e) {
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
    res.status(201).json({
      success: true,
      message: "Coupon created successfully!",
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

const deleteCoupon = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.coupon.delete({
      where: { id },
    });

    res.status(201).json({
      success: true,
      message: "Coupon deleted successfully!",
      id: id,
    });
  } catch (e) {
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
  deleteCoupon
}