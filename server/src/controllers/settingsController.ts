import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import { prisma } from "../lib/prisma";
import { uploadImageBuffer } from "../services/media/uploadImage";
import { scheduleProductIndexRebuild } from "../services/ai/productIndex";
import { sentryTracker } from "../lib/monitoring";

const addFeatureBanners = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "No files provided",
      });
      return;
    }

    // Uploads use multer memoryStorage, so files have a buffer and no disk path.
    const imageUrls = await Promise.all(
      files.map((file) =>
        uploadImageBuffer(file.buffer, "ecommerce-prisma/ecommerce-feature-banners")
      )
    );

    const banners = await prisma.$transaction(
      imageUrls.map((imageUrl) => prisma.featureBanner.create({ data: { imageUrl } }))
    );

    res.status(201).json({
      success: true,
      banners,
    });
  } catch (e) {
    sentryTracker(e, { source: "settingsController" });
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to add feature banners",
    });
  }
};

const fetchFeatureBanners = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const banners = await prisma.featureBanner.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      banners,
    });
  } catch (e) {
    sentryTracker(e, { source: "settingsController" });
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feature banners",
    });
  }
};

const updateFeaturedProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { productIds } = req.body;

    if (
      !Array.isArray(productIds) ||
      productIds.length > 8 ||
      !productIds.every((id) => typeof id === "string" && id.trim().length > 0)
    ) {
      res.status(400).json({
        success: false,
        message: `Invalid product Id's or too many requests`,
      });
      return;
    }

    // One transaction so a failure never leaves the storefront with no featured products.
    await prisma.$transaction([
      prisma.product.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      }),
      prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isFeatured: true },
      }),
    ]);

    scheduleProductIndexRebuild();

    res.status(200).json({
      success: true,
      message: "Featured products updated successfully !",
    });
  } catch (e) {
    sentryTracker(e, { source: "settingsController" });
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to update feature products",
    });
  }
};

const getFeaturedProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const featuredProducts = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true, isArchived: false },
    });

    res.status(200).json({
      success: true,
      featuredProducts,
    });
  } catch (e) {
    sentryTracker(e, { source: "settingsController" });
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feature products",
    });
  }
};

export {
  addFeatureBanners,
  fetchFeatureBanners,
  updateFeaturedProducts,
  getFeaturedProducts
}