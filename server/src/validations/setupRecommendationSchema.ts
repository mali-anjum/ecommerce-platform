import { z } from "zod";

export const setupRecommendationQuerySchema = z.object({
  productId: z.uuid(),
  sessionId: z.uuid().optional(),
  visitorId: z.uuid().optional(),
});

export type SetupRecommendationQuery = z.infer<
  typeof setupRecommendationQuerySchema
>;
