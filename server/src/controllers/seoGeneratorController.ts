import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { generateSeoContent } from "../services/ai/seo";
import { seoGeneratorSchema } from "../validations/seoGeneratorSchema";

export const postAdminSeoContentGenerate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const body = req.validatedData as ReturnType<typeof seoGeneratorSchema.parse>;

    const content = await generateSeoContent({
      productName: body.productName,
      category: body.category,
      brand: body.brand,
      tone: body.tone,
      storeName: body.storeName,
    });

    res.json(new ApiResponse(200, content, "SEO content generated"));
  },
);
