import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import {
  createFaqItem,
  deleteFaqItem,
  getStorePolicies,
  listAllFaqsForAdmin,
  listPublicFaqs,
  updateFaqItem,
  updateStorePolicies,
} from "../services/knowledge/knowledgeService";
import { NotFoundError } from "../utils/ApiError";

export const getPublicFaqs = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const faqs = await listPublicFaqs();
    res.json(new ApiResponse(200, { faqs }, "FAQ list loaded"));
  },
);

export const getAdminFaqs = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const faqs = await listAllFaqsForAdmin();
    res.json(new ApiResponse(200, { faqs }, "FAQ list loaded"));
  },
);

export const createAdminFaq = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const faq = await createFaqItem(req.validatedData);
    res.status(201).json(new ApiResponse(201, { faq }, "FAQ created"));
  },
);

export const updateAdminFaq = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    try {
      const faq = await updateFaqItem(id, req.validatedData);
      res.json(new ApiResponse(200, { faq }, "FAQ updated"));
    } catch {
      throw new NotFoundError("FAQ not found");
    }
  },
);

export const deleteAdminFaq = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    try {
      await deleteFaqItem(id);
      res.json(new ApiResponse(200, { id }, "FAQ deleted"));
    } catch {
      throw new NotFoundError("FAQ not found");
    }
  },
);

export const getStorePoliciesHandler = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const policies = await getStorePolicies();
    res.json(new ApiResponse(200, { policies }, "Store policies loaded"));
  },
);

export const updateStorePoliciesHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const policies = await updateStorePolicies(req.validatedData);
    res.json(new ApiResponse(200, { policies }, "Store policies updated"));
  },
);
