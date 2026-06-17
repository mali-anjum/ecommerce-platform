import { z } from "zod";

export const seoGeneratorSchema = z.object({
  productName: z.string().trim().min(2).max(200),
  category: z.string().trim().max(120).optional(),
  brand: z.string().trim().max(120).optional(),
  tone: z.enum(["professional", "friendly", "premium"]).optional(),
  storeName: z.string().trim().max(80).optional(),
});
