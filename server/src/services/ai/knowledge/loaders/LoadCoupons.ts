import { prisma } from "../../../../lib/prisma";
import type { AssistantCouponSnippet } from "../../types";

const MAX_COUPONS = 5;

export async function loadActiveCoupons(): Promise<AssistantCouponSnippet[]> {
  const now = new Date();
  return prisma.coupon.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      // Do not advertise codes that checkout would reject as used up.
      usageCount: { lt: prisma.coupon.fields.usageLimit },
    },
    orderBy: { discountPercent: "desc" },
    take: MAX_COUPONS,
    select: {
      code: true,
      discountPercent: true,
      minOrderValue: true,
      maxDiscount: true,
      isActive: true,
    },
  });
}
