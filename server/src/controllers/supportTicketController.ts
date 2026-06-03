import { Response, NextFunction } from "express";
import { SupportTicketStatus } from "@prisma/client";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { NotFoundError } from "../utils/ApiError";
import {
  addAgentReply,
  closeSupportTicket,
  listSupportTickets,
} from "../services/ai/handoff/SupportTicketService";

export const getAdminSupportTickets = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const statusRaw = String(req.query.status ?? "").toUpperCase();
    const status =
      statusRaw === "OPEN" || statusRaw === "CLOSED"
        ? (statusRaw as SupportTicketStatus)
        : undefined;

    const tickets = await listSupportTickets(status);
    res.json(new ApiResponse(200, { tickets }, "Support tickets loaded"));
  },
);

export const closeAdminSupportTicket = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    try {
      const ticket = await closeSupportTicket(req.params.id);
      res.json(new ApiResponse(200, { ticket }, "Support ticket closed"));
    } catch {
      throw new NotFoundError("Support ticket not found");
    }
  },
);

export const replyAdminSupportTicket = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const content = String(req.body?.message ?? "").trim();
    if (!content) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Message is required"));
    }

    try {
      const ticket = await addAgentReply(req.params.id, content);
      res.json(new ApiResponse(200, { ticket }, "Agent reply added"));
    } catch {
      throw new NotFoundError("Support ticket not found");
    }
  },
);
