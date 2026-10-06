import { z } from "zod";

const dateInput = z.coerce.date({ error: "Must be a valid date" });

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(32, "Code must be at most 32 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Code may only contain letters, numbers, - and _"),
    discountPercent: z.coerce
      .number()
      .gt(0, "Discount must be greater than 0")
      .max(100, "Discount cannot exceed 100%"),
    startDate: dateInput,
    endDate: dateInput,
    usageLimit: z.coerce.number().int("Usage limit must be a whole number").min(1, "Usage limit must be at least 1"),
  })
  .refine((value) => value.endDate > value.startDate, {
    path: ["endDate"],
    message: "End date must be after the start date",
  });

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required").max(32),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
