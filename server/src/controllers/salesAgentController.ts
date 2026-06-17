import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import {
  captureGuestEmailForSales,
  dismissOffer,
  fetchSalesAgentAdminDashboard,
  getPendingOffersForSession,
  getSalesAgentContext,
  markOfferShown,
} from "../services/ai/sales";
import {
  captureGuestEmailSchema,
  salesOfferActionSchema,
  salesOffersQuerySchema,
} from "../validations/salesAgentSchema";

export const getSalesOffers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const parsed = salesOffersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid sessionId");
    }

    const offers = await getPendingOffersForSession(parsed.data.sessionId);

    res.json(new ApiResponse(200, { offers }, "Sales offers loaded"));
  },
);

export const getSalesContext = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const parsed = salesOffersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid sessionId");
    }

    const visitorId =
      typeof req.query.visitorId === "string" ? req.query.visitorId : undefined;

    const context = await getSalesAgentContext({
      sessionId: parsed.data.sessionId,
      userId: req.user?.userId,
      visitorId,
    });

    res.json(new ApiResponse(200, { context }, "Sales context loaded"));
  },
);

export const postCaptureGuestEmail = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const body = req.validatedData as ReturnType<typeof captureGuestEmailSchema.parse>;

    const result = await captureGuestEmailForSales({
      sessionId: body.sessionId,
      email: body.email,
      visitorId: body.visitorId,
      userId: req.user?.userId,
    });

    res.json(
      new ApiResponse(200, result, "Email captured and follow-up scheduled"),
    );
  },
);

export const postSalesOfferShown = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const body = req.validatedData as ReturnType<typeof salesOfferActionSchema.parse>;
    await markOfferShown(id, body.sessionId);

    res.json(new ApiResponse(200, { acknowledged: true }, "Offer marked shown"));
  },
);

export const postSalesOfferDismiss = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const body = req.validatedData as ReturnType<typeof salesOfferActionSchema.parse>;
    await dismissOffer(id, body.sessionId);

    res.json(new ApiResponse(200, { dismissed: true }, "Offer dismissed"));
  },
);

export const getAdminSalesAgentDashboard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const dashboard = await fetchSalesAgentAdminDashboard(req.query.period);
    res.json(
      new ApiResponse(200, dashboard, "Sales agent dashboard loaded"),
    );
  },
);
