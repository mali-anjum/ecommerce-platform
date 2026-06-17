import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import {
  createProductReview,
  listProductReviews,
} from "../services/ai/reviews";
import { createProductReviewSchema } from "../validations/reviewSchema";

export const postProductReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user?.userId || req.user.role !== "USER") {
      throw new ApiError(403, "Only customers can submit product reviews");
    }

    const body = req.validatedData as ReturnType<
      typeof createProductReviewSchema.parse
    >;

    const result = await createProductReview({
      userId: req.user.userId,
      productId: body.productId,
      orderId: body.orderId,
      rating: body.rating,
      body: body.body,
    });

    res.status(201).json(new ApiResponse(201, result, "Review submitted"));
  },
);

export const getProductReviews = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const productId = req.params.productId;
    if (!productId) {
      throw new ApiError(400, "Product id is required");
    }

    const reviews = await listProductReviews(productId);
    res.json(new ApiResponse(200, { reviews }, "Product reviews loaded"));
  },
);
