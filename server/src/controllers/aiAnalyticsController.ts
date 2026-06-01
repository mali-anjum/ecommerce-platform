import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { fetchAiAnalyticsDashboard } from "../services/ai/aiAnalyticsService";

export const getAiAnalyticsDashboard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const dashboard = await fetchAiAnalyticsDashboard(req.query.period);
    res.json(
      new ApiResponse(200, dashboard, "AI analytics dashboard loaded"),
    );
  },
);
