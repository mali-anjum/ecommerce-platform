import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { requireUserId } from "../utils/requireUserId";
import { WishlistService } from "../services/wishlist/wishlistService";

export const getWishlist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const data = await WishlistService.getUserWishlist(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Wishlist fetched successfully"));
  }
);

export const toggleWishlist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const productId =
      (req.validatedData as { productId?: string } | undefined)?.productId ??
      req.body?.productId;

    if (!productId || typeof productId !== "string") {
      throw new ApiError(400, "Product ID is required");
    }

    const result = await WishlistService.toggleItem(userId, productId);

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        result.action === "added"
          ? "Product added to wishlist"
          : "Product removed from wishlist"
      )
    );
  }
);

export const removeWishlistItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Wishlist item id is required");
    }

    await WishlistService.removeItem(userId, id);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Item removed from wishlist"));
  }
);
