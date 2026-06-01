import { z } from "zod";

export const createFaqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  href: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
// make createFaqSchema all values optional
export const updateFaqSchema = createFaqSchema.partial();

export const updateStorePoliciesSchema = z.object({
  returnPolicy: z.string().max(10000).optional(),
  shippingPolicy: z.string().max(10000).optional(),
  shipsInternationally: z.boolean().optional(),
  internationalShippingDetails: z.string().max(5000).optional(),
  supportEmail: z.email().optional().nullable(),
});
