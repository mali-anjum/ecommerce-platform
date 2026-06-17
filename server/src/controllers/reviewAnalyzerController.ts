import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { buildReviewAnalyzerReport } from "../services/ai/reviews";

export const getAdminReviewAnalyzerDashboard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const report = await buildReviewAnalyzerReport(req.query.period);
    res.json(new ApiResponse(200, report, "Review analyzer report loaded"));
  },
);

export const postAdminReviewAnalyzerRefresh = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const report = await buildReviewAnalyzerReport(req.query.period);
    res.json(new ApiResponse(200, report, "Reviews re-analyzed"));
  },
);
