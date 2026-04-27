import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { NotFoundError, ValidationError } from "../utils/ApiError";
import {
  upsertCatalogFromConstants,
  linkOrphanProductsToSubcategories,
} from "../services/catalogService";

/** Upserts Electronics / Fashion / … from `PRODUCT_CATEGORY_CATALOG`; links products by `category` title. */
export const seedCatalogEndpoint = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response) => {
    const seeded = await upsertCatalogFromConstants();
    const productsLinked = await linkOrphanProductsToSubcategories();
    return res.status(200).json(
      new ApiResponse(
        200,
        { ...seeded, productsLinked },
        "Catalog seeded from constants; products linked where possible."
      )
    );
  }
);

export const adminCreateDepartment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, slug, description, sortOrder } = req.body as Record<
      string,
      unknown
    >;
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new ValidationError("title is required");
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
      throw new ValidationError("slug is required");
    }

    const row = await prisma.department.create({
      data: {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        description:
          typeof description === "string" ? description.trim() || null : null,
        sortOrder:
          typeof sortOrder === "number"
            ? sortOrder
            : Number(sortOrder ?? 0) || 0,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, row, "Department created successfully"));
  }
);

export const adminUpdateDepartment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id?.trim()) throw new ValidationError("Department id required");

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError(`Department "${id}" not found`);

    const { title, slug, description, sortOrder, isActive } = req.body as Record<
      string,
      unknown
    >;

    const row = await prisma.department.update({
      where: { id },
      data: {
        ...(typeof title === "string" ? { title: title.trim() } : {}),
        ...(typeof slug === "string"
          ? { slug: slug.trim().toLowerCase() }
          : {}),
        ...(typeof description === "string"
          ? { description: description.trim() || null }
          : {}),
        ...(sortOrder !== undefined
          ? {
              sortOrder:
                typeof sortOrder === "number"
                  ? sortOrder
                  : Number(sortOrder ?? 0) || 0,
            }
          : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, row, "Department updated successfully"));
  }
);

export const adminDeleteDepartment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id?.trim()) throw new ValidationError("Department id required");

    await prisma.department.delete({ where: { id } });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Department deleted successfully"));
  }
);

export const adminCreateSubcategory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { departmentId, title, slug, sortOrder } = req.body as Record<
      string,
      unknown
    >;
    if (!departmentId || typeof departmentId !== "string") {
      throw new ValidationError("departmentId is required");
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new ValidationError("title is required");
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
      throw new ValidationError("slug is required");
    }

    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!dept) throw new NotFoundError(`Department "${departmentId}" not found`);

    const row = await prisma.subcategory.create({
      data: {
        departmentId,
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        sortOrder:
          typeof sortOrder === "number"
            ? sortOrder
            : Number(sortOrder ?? 0) || 0,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, row, "Subcategory created successfully"));
  }
);

export const adminUpdateSubcategory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id?.trim()) throw new ValidationError("Subcategory id required");

    const existing = await prisma.subcategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError(`Subcategory "${id}" not found`);

    const { title, slug, sortOrder, isActive } = req.body as Record<
      string,
      unknown
    >;

    const row = await prisma.subcategory.update({
      where: { id },
      data: {
        ...(typeof title === "string" ? { title: title.trim() } : {}),
        ...(typeof slug === "string"
          ? { slug: slug.trim().toLowerCase() }
          : {}),
        ...(sortOrder !== undefined
          ? {
              sortOrder:
                typeof sortOrder === "number"
                  ? sortOrder
                  : Number(sortOrder ?? 0) || 0,
            }
          : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, row, "Subcategory updated successfully"));
  }
);

export const adminDeleteSubcategory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id?.trim()) throw new ValidationError("Subcategory id required");

    await prisma.subcategory.delete({ where: { id } });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Subcategory deleted successfully"));
  }
);
