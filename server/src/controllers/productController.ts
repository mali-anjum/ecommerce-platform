import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import cloudinary from "../config/cloudinary";
import { prisma } from "../lib/prisma";
import { Prisma, ProductCondition } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import {
  ApiError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/ApiError";
import { parseMaybeArray } from "../utils/parsedArray";
import { ApiResponse } from "../utils/ApiResponse";
import { createLogger } from "../utils/logger";
import {
  fetchClientProductListing,
  fetchProductsForAdminPaginated,
  findProductDetailById,
  getProductCategoriesPayload,
  parseAdminProductPagination,
  parseProductConditionValue,
} from "../services/product";
import { scheduleProductIndexSync } from "../services/ai/productIndex";

// TODO: Consider cleaning up uploaded Cloudinary images if DB insert failed (use public_id to delete).
// Use Promise.allSettled and handle partial failures gracefully.
const logger = createLogger("PRODUCT_CONTROLLER");

const createProduct = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("MULTER REQ.FILES type:", typeof req.files);
      console.log("isArray(req.files):", Array.isArray(req.files));
      console.log(
        "req.files length/name(s):",
        Array.isArray(req.files)
          ? (req.files as Express.Multer.File[]).map((f) => ({
              name: f.originalname,
              size: f.size,
            }))
          : req.files
      );
      console.log("req.body images keys:", req.body.image, req.body.images);

      const {
        name,
        brand,
        description,
        category,
        gender,
        condition,
        sellerId,
        discountPercent,
        dealStartsAt,
        dealEndsAt,
        sizes,
        colors,
        price,
        stock,
      } = req.body;

      if (
        !name ||
        !brand ||
        !category ||
        !gender ||
        price === undefined ||
        stock === undefined
      ) {
        throw new ValidationError(
          "Missing required fields: name, brand, category, gender, price, stock"
        );
      }

      // accept images either from multer or from a provided URL field
      let files: Express.Multer.File[] = [];
      if (
        req.files &&
        Array.isArray(req.files) &&
        (req.files as any[]).length > 0
      ) {
        files = req.files as Express.Multer.File[];
      }

      // if no files, but client provided image URLs as 'image' or 'images' in body, accept them
      const fallbackImageUrls: string[] = [];
      if (files.length === 0) {
        if (req.body.image) fallbackImageUrls.push(req.body.image);
        if (req.body.images && Array.isArray(req.body.images))
          fallbackImageUrls.push(...req.body.images);
      }

      if (files.length === 0 && fallbackImageUrls.length === 0) {
        throw new ValidationError("No images uploaded");
      }

      let imageUrls: string[] = [];
      if (files.length > 0) {
        const uploadFiles = files.map((file) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "ecommerce-prisma/products" },
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
            uploadStream.end(file.buffer);
          });
        });
        const uploadResults = await Promise.all(uploadFiles);
        imageUrls = uploadResults.map((r: any) => r.secure_url);
      } else {
        imageUrls = fallbackImageUrls;
      }

      const processedSizes = parseMaybeArray(sizes);
      const processedColors = parseMaybeArray(colors);
      if (processedSizes.length === 0) {
        throw new ValidationError("At least one size is required");
      }
      if (processedColors.length === 0) {
        throw new ValidationError("At least one color is required");
      }

      const parsedPrice = typeof price === "number" ? price : Number(price);
      const parsedStock = typeof stock === "number" ? stock : Number(stock);
      if (Number.isNaN(parsedPrice) || Number.isNaN(parsedStock)) {
        throw new ValidationError("price and stock must be numeric");
      }

      const parsedCondition = parseProductConditionValue(condition);
      if (condition !== undefined && !parsedCondition) {
        throw new ValidationError(
          "condition must be one of NEW, REFURBISHED, USED"
        );
      }

      let validatedSellerId: string | null = null;
      if (req.user?.role === "SELLER") {
        const sid = req.sellerProfile?.id;
        if (!sid) {
          throw new UnauthorizedError("Seller context required");
        }
        validatedSellerId = sid;
      } else if (req.user?.role === "SUPER_ADMIN") {
        if (typeof sellerId === "string" && sellerId.trim() !== "") {
          const seller = await prisma.seller.findUnique({
            where: { id: sellerId.trim() },
            select: { id: true },
          });
          if (!seller) throw new ValidationError("Invalid sellerId");
          validatedSellerId = seller.id;
        }
      }

      const parsedDiscountPercent =
        discountPercent === undefined || discountPercent === null || discountPercent === ""
          ? null
          : Number(discountPercent);
      if (
        parsedDiscountPercent !== null &&
        (!Number.isFinite(parsedDiscountPercent) ||
          parsedDiscountPercent < 0 ||
          parsedDiscountPercent > 100)
      ) {
        throw new ValidationError("discountPercent must be between 0 and 100");
      }

      const parsedDealStartsAt = dealStartsAt
        ? new Date(String(dealStartsAt))
        : null;
      const parsedDealEndsAt = dealEndsAt ? new Date(String(dealEndsAt)) : null;
      if (parsedDealStartsAt && Number.isNaN(parsedDealStartsAt.getTime())) {
        throw new ValidationError("Invalid dealStartsAt datetime");
      }
      if (parsedDealEndsAt && Number.isNaN(parsedDealEndsAt.getTime())) {
        throw new ValidationError("Invalid dealEndsAt datetime");
      }
      if (
        parsedDealStartsAt &&
        parsedDealEndsAt &&
        parsedDealStartsAt > parsedDealEndsAt
      ) {
        throw new ValidationError("dealStartsAt cannot be after dealEndsAt");
      }

      let resolvedCategory = category as string;
      let subcategoryId: string | null = null;

      const bodySubId =
        typeof req.body.subcategoryId === "string"
          ? req.body.subcategoryId.trim()
          : "";
      if (bodySubId) {
        const sub = await prisma.subcategory.findUnique({
          where: { id: bodySubId },
        });
        if (!sub) {
          throw new ValidationError(`Invalid subcategoryId: ${bodySubId}`);
        }
        subcategoryId = sub.id;
        resolvedCategory = sub.title;
      } else if (req.body.departmentSlug && req.body.subcategorySlug) {
        const ds = String(req.body.departmentSlug).trim().toLowerCase();
        const ss = String(req.body.subcategorySlug).trim().toLowerCase();
        const sub = await prisma.subcategory.findFirst({
          where: {
            slug: ss,
            department: { slug: ds },
          },
        });
        if (sub) {
          subcategoryId = sub.id;
          resolvedCategory = sub.title;
        }
      }

      const newlyCreatedProduct = await prisma.product.create({
        data: {
          name,
          brand,
          condition: parsedCondition ?? ProductCondition.NEW,
          description,
          category: resolvedCategory,
          gender,
          sellerId: validatedSellerId,
          discountPercent: parsedDiscountPercent,
          dealStartsAt: parsedDealStartsAt,
          dealEndsAt: parsedDealEndsAt,
          sizes: processedSizes,
          colors: processedColors,
          price: parsedPrice,
          stock: parsedStock,
          images: imageUrls,
          soldCount: 0,
          rating: 0,
          subcategoryId,
        },
      });

      logger.info("Product created successfully", {
        productId: newlyCreatedProduct.id,
        productName: name,
      });
      scheduleProductIndexSync(newlyCreatedProduct.id);
      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            newlyCreatedProduct,
            "Product created successfully."
          )
        );
    } catch (error) {
      logger.requestError(error as Error, req, "createProduct");
      throw error;
    }
  }
);

// TODO:- Add pagination
const fetchAllProductsForAdmin = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }
    const sellerScope =
      req.user.role === "SELLER" ? req.sellerProfile?.id ?? null : null;
    if (req.user.role === "SELLER" && !sellerScope) {
      throw new UnauthorizedError("Seller profile required");
    }
    if (req.user.role !== "SUPER_ADMIN" && req.user.role !== "SELLER") {
      throw new UnauthorizedError("Admin or seller privileges required");
    }

    const { page, limit } = parseAdminProductPagination(
      req.query.page,
      req.query.limit
    );

    try {
      const { items, meta } = await fetchProductsForAdminPaginated(
        sellerScope,
        page,
        limit
      );

      return res.status(200).json(
        new ApiResponse(200, { items, meta }, "Products fetched successfully")
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerError("Database error occurred");
      }
      throw error;
    }
  }
);

const getProductByID = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new ValidationError("Product id is required");
    }

    const product = await findProductDetailById(id);

    if (!product) {
      throw new NotFoundError(`Product with id "${id}" not found`);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product fetched successfully"));
  }
);

const updateProduct = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new ValidationError("Product id is required");
    }

    const existingForAuth = await prisma.product.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });
    if (!existingForAuth) {
      throw new NotFoundError(`Product with id "${id}" not found`);
    }
    if (req.user?.role === "SELLER") {
      if (existingForAuth.sellerId !== req.sellerProfile?.id) {
        throw new UnauthorizedError("Cannot modify this product");
      }
    }

    const {
      name,
      brand,
      description,
      category,
      gender,
      sizes,
      colors,
      price,
      stock,
      rating,
      condition,
      sellerId,
      discountPercent,
      dealStartsAt,
      dealEndsAt,
    } = req.body;
    const processedSizes = parseMaybeArray(sizes);
    const processedColors = parseMaybeArray(colors);
    if (processedSizes.length === 0) {
      throw new ValidationError("At least one size is required");
    }
    if (processedColors.length === 0) {
      throw new ValidationError("At least one color is required");
    }

    const parsedCondition = parseProductConditionValue(condition);
    if (condition !== undefined && !parsedCondition) {
      throw new ValidationError("condition must be one of NEW, REFURBISHED, USED");
    }

    let validatedSellerId: string | null | undefined = undefined;
    if (req.user?.role === "SUPER_ADMIN") {
      if (typeof sellerId === "string") {
        const trimmedSellerId = sellerId.trim();
        if (trimmedSellerId === "") {
          validatedSellerId = null;
        } else {
          const seller = await prisma.seller.findUnique({
            where: { id: trimmedSellerId },
            select: { id: true },
          });
          if (!seller) throw new ValidationError("Invalid sellerId");
          validatedSellerId = seller.id;
        }
      }
    }

    const hasDiscountPercentInput =
      discountPercent !== undefined &&
      discountPercent !== null &&
      String(discountPercent).trim() !== "";
    const parsedDiscountPercent = hasDiscountPercentInput
      ? Number(discountPercent)
      : undefined;
    if (
      parsedDiscountPercent !== undefined &&
      (!Number.isFinite(parsedDiscountPercent) ||
        parsedDiscountPercent < 0 ||
        parsedDiscountPercent > 100)
    ) {
      throw new ValidationError("discountPercent must be between 0 and 100");
    }

    const parseOptionalDate = (value: unknown): Date | null | undefined => {
      if (value === undefined) return undefined;
      if (value === null || String(value).trim() === "") return null;
      const parsed = new Date(String(value));
      if (Number.isNaN(parsed.getTime())) {
        throw new ValidationError("Invalid deal date value");
      }
      return parsed;
    };

    const parsedDealStartsAt = parseOptionalDate(dealStartsAt);
    const parsedDealEndsAt = parseOptionalDate(dealEndsAt);
    if (
      parsedDealStartsAt instanceof Date &&
      parsedDealEndsAt instanceof Date &&
      parsedDealStartsAt > parsedDealEndsAt
    ) {
      throw new ValidationError("dealStartsAt cannot be after dealEndsAt");
    }

    let resolvedCategory = category as string | undefined;
    let subcategoryIdUpdate: string | null | undefined = undefined;

    if (typeof req.body.subcategoryId === "string") {
      const sid = req.body.subcategoryId.trim();
      if (sid === "") {
        subcategoryIdUpdate = null;
      } else {
        const sub = await prisma.subcategory.findUnique({ where: { id: sid } });
        if (!sub) throw new ValidationError(`Invalid subcategoryId: ${sid}`);
        subcategoryIdUpdate = sub.id;
        resolvedCategory = sub.title;
      }
    } else if (
      typeof req.body.departmentSlug === "string" &&
      typeof req.body.subcategorySlug === "string"
    ) {
      const ds = String(req.body.departmentSlug).trim().toLowerCase();
      const ss = String(req.body.subcategorySlug).trim().toLowerCase();
      const sub = await prisma.subcategory.findFirst({
        where: { slug: ss, department: { slug: ds } },
      });
      if (sub) {
        subcategoryIdUpdate = sub.id;
        resolvedCategory = sub.title;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        brand,
        description,
        category: resolvedCategory ?? category,
        ...(subcategoryIdUpdate !== undefined
          ? { subcategoryId: subcategoryIdUpdate }
          : {}),
        gender,
        ...(parsedCondition ? { condition: parsedCondition } : {}),
        ...(validatedSellerId !== undefined ? { sellerId: validatedSellerId } : {}),
        ...(parsedDiscountPercent !== undefined
          ? { discountPercent: parsedDiscountPercent }
          : {}),
        ...(parsedDealStartsAt !== undefined
          ? { dealStartsAt: parsedDealStartsAt }
          : {}),
        ...(parsedDealEndsAt !== undefined ? { dealEndsAt: parsedDealEndsAt } : {}),
        sizes: processedSizes,
        colors: processedColors,
        price: parseFloat(price),
        stock: parseInt(stock), // ✅ Better: parseInt for stock
        ...(rating !== undefined &&
        rating !== null &&
        String(rating).trim() !== "" &&
        !Number.isNaN(Number(rating))
          ? { rating: Number(rating) }
          : {}),
      },
    });

    scheduleProductIndexSync(product.id);

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product updated successfully"));
  }
);

const deleteProduct = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new ValidationError("Product id is required");
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true },
    });
    if (!existing) {
      throw new NotFoundError(`Product with id "${id}" not found`);
    }
    if (req.user?.role === "SELLER") {
      if (existing.sellerId !== req.sellerProfile?.id) {
        throw new UnauthorizedError("Cannot delete this product");
      }
    }

    await prisma.product.delete({ where: { id } });
    scheduleProductIndexSync(id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Product deleted successfully")); // ✅ Added empty object as data
  }
);

const getProductsForClient = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const payload = await fetchClientProductListing(req.query);
    return res.status(200).json(
      new ApiResponse(
        200,
        payload,
        "Products fetched for the clients successfully.."
      )
    );
  }
);

const getProductCategories = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response) => {
    const categoriesWithCounts = await getProductCategoriesPayload();
    return res.status(200).json(
      new ApiResponse(
        200,
        categoriesWithCounts,
        "Product categories fetched successfully"
      )
    );
  }
);

export {
  createProduct,
  fetchAllProductsForAdmin,
  getProductByID,
  updateProduct,
  deleteProduct,
  getProductsForClient,
  getProductCategories,
};
