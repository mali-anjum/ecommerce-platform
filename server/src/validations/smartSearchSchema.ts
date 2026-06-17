import { z } from "zod";

export const smartSearchSchema = z.object({
  query: z.string().trim().min(3).max(500),
  limit: z.coerce.number().int().min(1).max(48).optional(),
});
