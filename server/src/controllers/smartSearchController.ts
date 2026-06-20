import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { runSmartSearch, isSmartSearchQuery } from "../services/ai/search";
import { smartSearchSchema } from "../validations/smartSearchSchema";

export const postSmartSearch = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const body = req.validatedData as ReturnType<typeof smartSearchSchema.parse>;

    if (!isSmartSearchQuery(body.query) && body.query.split(/\s+/).length < 3) {
      throw new ApiError(
        400,
        "Describe what you need in a short sentence, e.g. wireless mouse under $50 for FPS games",
      );
    }

    const result = await runSmartSearch(body.query, { limit: body.limit });

    res.json(new ApiResponse(200, result, "Smart search results"));
  },
);
