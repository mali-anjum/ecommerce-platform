import { z } from "zod";

export const createProductReviewSchema = z.object({
  productId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(3).max(2000),
});
