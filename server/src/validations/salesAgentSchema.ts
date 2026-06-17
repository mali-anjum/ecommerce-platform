import { z } from "zod";

export const salesOffersQuerySchema = z.object({
  sessionId: z.uuid(),
});

export const salesContextQuerySchema = salesOffersQuerySchema.extend({
  visitorId: z.uuid().optional(),
});

export const salesOfferActionSchema = z.object({
  sessionId: z.uuid(),
});

export const captureGuestEmailSchema = z.object({
  sessionId: z.uuid(),
  email: z.email(),
  visitorId: z.uuid().optional(),
});

export type SalesOffersQuery = z.infer<typeof salesOffersQuerySchema>;
export type SalesOfferActionBody = z.infer<typeof salesOfferActionSchema>;
export type CaptureGuestEmailBody = z.infer<typeof captureGuestEmailSchema>;
