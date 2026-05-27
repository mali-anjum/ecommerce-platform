import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { fetchAnalyticsDashboard } from "../services/analytics/analyticsService";

export const getAnalyticsDashboard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const dashboard = await fetchAnalyticsDashboard(req.query.period);
    res.json(new ApiResponse(200, dashboard, "Analytics dashboard loaded"));
  },
);
