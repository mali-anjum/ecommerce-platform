import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { getSetupRecommendations } from "../services/ai/recommendations/SetupRecommendationService";
import { setupRecommendationQuerySchema } from "../validations/setupRecommendationSchema";

export const getAiSetupRecommendations = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const parsed = setupRecommendationQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid recommendation query");
    }

    const setup = await getSetupRecommendations({
      productId: parsed.data.productId,
      sessionId: parsed.data.sessionId,
      userId: req.user?.userId,
      visitorId: parsed.data.visitorId,
    });

    res.json(
      new ApiResponse(
        200,
        { setup },
        setup ? "Setup recommendations loaded" : "No setup recommendations",
      ),
    );
  },
);
