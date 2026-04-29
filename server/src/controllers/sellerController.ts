import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { UnauthorizedError, ValidationError } from "../utils/ApiError";
import { issueSessionForUser } from "./authController";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const registerAsSeller = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }
    if (req.user.role !== "USER") {
      throw new ValidationError(
        "Only shoppers without a seller account can register as a seller"
      );
    }

    const storeName = typeof req.body.storeName === "string"
      ? req.body.storeName.trim()
      : "";
    const slugRaw =
      typeof req.body.slug === "string" ? req.body.slug.trim().toLowerCase() : "";

    if (!storeName || storeName.length < 2) {
      throw new ValidationError("storeName must be at least 2 characters");
    }
    if (!slugRaw || slugRaw.length < 2) {
      throw new ValidationError("slug must be at least 2 characters");
    }
    if (!SLUG_RE.test(slugRaw)) {
      throw new ValidationError(
        "slug must be lowercase letters, numbers, and single hyphens only"
      );
    }

    const slugTaken = await prisma.seller.findUnique({
      where: { slug: slugRaw },
      select: { id: true },
    });
    if (slugTaken) {
      throw new ValidationError("This store slug is already taken");
    }

    const seller = await prisma.$transaction(async (tx) => {
      const created = await tx.seller.create({
        data: {
          name: storeName,
          slug: slugRaw,
          userId: req.user!.userId,
          isActive: true,
        },
      });
      await tx.user.update({
        where: { id: req.user!.userId },
        data: { role: "SELLER" },
      });
      return created;
    });

    const user = await issueSessionForUser(res, req.user.userId);

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          seller: {
            id: seller.id,
            name: seller.name,
            slug: seller.slug,
          },
          user,
        },
        "Seller account created. Session updated."
      )
    );
  }
);

const getMySellerProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || req.user.role !== "SELLER") {
      throw new UnauthorizedError("Seller account required");
    }
    const seller = await prisma.seller.findUnique({
      where: { userId: req.user.userId },
      select: {
        id: true,
        name: true,
        slug: true,
        isPremium: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!seller) {
      throw new ValidationError("Seller profile not found");
    }

    const productCount = await prisma.product.count({
      where: { sellerId: seller.id },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...seller,
          productCount,
        },
        "Seller profile"
      )
    );
  }
);

export { registerAsSeller, getMySellerProfile };
