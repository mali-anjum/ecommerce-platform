import { Response, NextFunction } from "express";
import { LeadSource } from "@prisma/client";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import {
  countLeadsBySource,
  createLead,
  listLeads,
} from "../services/lead/leadService";
import type { CreateLeadBody } from "../validations/leadSchema";

export const postLead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const body = req.validatedData as CreateLeadBody;
    const lead = await createLead({
      email: body.email,
      phone: body.phone,
      message: body.message,
      source: body.source === "MANUAL" ? LeadSource.MANUAL : LeadSource.AI,
    });

    res
      .status(201)
      .json(new ApiResponse(201, { lead }, "Lead captured successfully"));
  },
);

export const getLeads = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const sourceParam = String(req.query.source ?? "").trim().toUpperCase();
    const source =
      sourceParam === "AI" || sourceParam === "MANUAL"
        ? (sourceParam as LeadSource)
        : undefined;

    const [leads, counts] = await Promise.all([
      listLeads(source ? { source } : undefined),
      countLeadsBySource(),
    ]);

    res.json(
      new ApiResponse(200, { leads, counts }, "Leads loaded successfully"),
    );
  },
);
