import { z } from "zod";

export const createLeadSchema = z.object({
  email: z.email("Valid email is required"),
  phone: z.string().max(30).optional().nullable(),
  message: z.string().min(1, "Message is required").max(5000),
  source: z.enum(["AI", "MANUAL"]).optional(),
});

export type CreateLeadBody = z.infer<typeof createLeadSchema>;

export const listLeadsQuerySchema = z.object({
  source: z.enum(["AI", "MANUAL"]).optional(),
});
