import { z } from "zod";

const analyticsEventTypes = [
  "CHAT",
  "PRODUCT_VIEW",
  "CART_ADD",
  "ORDER_COMPLETE",
] as const;

export const analyticsEventSchema = z.object({
  type: z.enum(analyticsEventTypes),
  sessionId: z.uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AnalyticsEventBody = z.infer<typeof analyticsEventSchema>;
