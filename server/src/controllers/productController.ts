import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import cloudinary from "../config/cloudinary";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
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
import { PRODUCT_CATEGORY_CATALOG } from "../constants/productCategories";

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
        sizes,
        colors,
        price,
        stock,
      } = req.body;

      if (
        !name ||
        !brand ||
        !category ||
        price === undefined ||
        stock === undefined
      ) {
        throw new ValidationError(
          "Missing required fields: name, brand, category, price, stock"
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

      const parsedPrice = typeof price === "number" ? price : Number(price);
      const parsedStock = typeof stock === "number" ? stock : Number(stock);
      if (Number.isNaN(parsedPrice) || Number.isNaN(parsedStock)) {
        throw new ValidationError("price and stock must be numeric");
      }

      const newlyCreatedProduct = await prisma.product.create({
        data: {
          name,
          brand,
          description,
          category,
          gender,
          sizes: processedSizes,
          colors: processedColors,
          price: parsedPrice,
          stock: parsedStock,
          images: imageUrls,
          soldCount: 0,
          rating: 0,
        },
      });

      logger.info("Product created successfully", {
        productId: newlyCreatedProduct.id,
        productName: name,
      });
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
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      throw new UnauthorizedError("Admin privileges required");
    }

    // ✅ Improved validation with better error handling
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt((req.query.limit as string) || "50", 10)),
      200
    );

    // ✅ Validate that page and limit are actually numbers
    if (isNaN(page) || isNaN(limit)) {
      throw new ValidationError("Invalid pagination parameters");
    }

    const skip = (page - 1) * limit;

    try {
      // ✅ Use transaction for consistent data
      const [products, total] = await prisma.$transaction([
        prisma.product.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            stock: true,
            category: true,
            createdAt: true,
            // ✅ Consider adding updatedAt for admin views
            updatedAt: true,
          },
        }),
        prisma.product.count(),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: products,
            meta: {
              page,
              limit,
              total,
              totalPages,
              hasNext,
              hasPrev,
              skip,
            },
          },
          "Products fetched successfully"
        )
      );
    } catch (error) {
      // ✅ Specific error handling
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

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        images: true,
        brand: true,
        category: true,
        sizes: true,
        colors: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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
    } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        brand,
        description,
        category,
        gender,
        sizes: sizes.split(","),
        colors: colors.split(","), // ✅ FIXED: colors.split instead of sizes.split
        price: parseFloat(price),
        stock: parseInt(stock), // ✅ Better: parseInt for stock
        rating: parseInt(rating),
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product updated successfully"));
  }
);

const deleteProduct = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Product deleted successfully")); // ✅ Added empty object as data
  }
);

const getProductsForClient = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const categories = ((req.query.categories as string) || "")
      .split(",")
      .filter(Boolean);
    const colors = ((req.query.colors as string) || "")
      .split(",")
      .filter(Boolean);
    const sizes = ((req.query.sizes as string) || "")
      .split(",")
      .filter(Boolean);
    const brands = ((req.query.brands as string) || "")
      .split(",")
      .filter(Boolean);
    const mainCategory = (req.query.mainCategory as string) || "";
    const subcategory = (req.query.subcategory as string) || "";

    const minPrice = parseFloat(req.query.minPrice as string) || 0;
    const maxPrice =
      parseFloat(req.query.maxPrice as string) || Number.MAX_SAFE_INTEGER;

    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrderas as "asc" | "desc") || "desc";

    const skip = (page - 1) * limit;

    const selectedMainCategory = PRODUCT_CATEGORY_CATALOG.find(
      (category) => category.title.toLowerCase() === mainCategory.toLowerCase()
    );
    const selectedMainCategoryTokens = selectedMainCategory
      ? [selectedMainCategory.title, ...selectedMainCategory.subcategories.map((item) => item.title)]
      : [];

    const where: Prisma.ProductWhereInput = {
      AND: [
        selectedMainCategoryTokens.length > 0
          ? {
              category: {
                in: selectedMainCategoryTokens,
              },
            }
          : {},
        subcategory
          ? {
              category: {
                equals: subcategory,
                mode: "insensitive",
              },
            }
          : {},
        categories.length > 0
          ? {
              category: {
                in: categories,
                mode: "insensitive",
              },
            }
          : {},
        brands.length > 0
          ? {
              brand: {
                in: brands,
                mode: "insensitive",
              },
            }
          : {},
        sizes.length > 0
          ? {
              sizes: {
                hasSome: sizes,
              },
            }
          : {},
        colors.length > 0
          ? {
              colors: {
                hasSome: colors,
              },
            }
          : {},
        {
          price: { gte: minPrice, lte: maxPrice },
        },
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.product.count({ where }),
    ]);

    console.log(
      Math.ceil(total / limit),
      total,
      limit,
      "Math.ceil(total / limit)"
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          products,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          availableCategories: PRODUCT_CATEGORY_CATALOG,
        },
        "Products fetched for the clients successfully.."
      )
    );
  }
);

const getProductCategories = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response) => {
    const productCountByCategory = await prisma.product.groupBy({
      by: ["category"],
      _count: {
        _all: true,
      },
    });

    const categoryCountLookup = new Map<string, number>();
    const subCategoryCountLookup = new Map<string, number>();

    for (const row of productCountByCategory) {
      const categoryKey = row.category.toLowerCase();
      const categoryCatalog = PRODUCT_CATEGORY_CATALOG.find(
        (category) => category.title.toLowerCase() === categoryKey
      );
      const count = row._count._all;

      if (categoryCatalog) {
        categoryCountLookup.set(
          categoryKey,
          (categoryCountLookup.get(categoryKey) ?? 0) + count
        );
      } else {
        for (const category of PRODUCT_CATEGORY_CATALOG) {
          const matchedSubCategory = category.subcategories.find(
            (subCategory) => subCategory.title.toLowerCase() === categoryKey
          );

          if (matchedSubCategory) {
            categoryCountLookup.set(
              category.title.toLowerCase(),
              (categoryCountLookup.get(category.title.toLowerCase()) ?? 0) + count
            );
            subCategoryCountLookup.set(
              `${category.title.toLowerCase()}::${matchedSubCategory.title.toLowerCase()}`,
              (subCategoryCountLookup.get(
                `${category.title.toLowerCase()}::${matchedSubCategory.title.toLowerCase()}`
              ) ?? 0) + count
            );
          }
        }
      }
    }

    const categoriesWithCounts = PRODUCT_CATEGORY_CATALOG.map((category) => {
      const categoryTotal = categoryCountLookup.get(category.title.toLowerCase()) ?? 0;

      return {
        ...category,
        productCount: categoryTotal,
        subcategories: category.subcategories.map((subCategory) => ({
          ...subCategory,
          productCount:
            subCategoryCountLookup.get(
              `${category.title.toLowerCase()}::${subCategory.title.toLowerCase()}`
            ) ?? 0,
        })),
      };
    });

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
