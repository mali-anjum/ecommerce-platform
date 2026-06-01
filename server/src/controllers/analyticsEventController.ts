import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { scheduleAnalyticsEvent } from "../services/analytics/analyticsEventService";
import type { AnalyticsEventBody } from "../validations/analyticsEventSchema";

export const postAnalyticsEvent = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const body = req.validatedData as AnalyticsEventBody;

    scheduleAnalyticsEvent({
      type: body.type,
      userId: req.user?.userId,
      sessionId: body.sessionId,
      metadata: body.metadata,
    });

    res.status(202).json(new ApiResponse(202, { accepted: true }, "Event logged"));
  },
);
