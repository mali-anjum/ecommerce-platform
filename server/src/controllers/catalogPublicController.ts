import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { getCatalogTreeWithCounts } from "../services/catalogService";

/** Full tree + product counts per department/subcategory (public). */
export const getCatalogTree = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response) => {
    const data = await getCatalogTreeWithCounts();
    return res.status(200).json(
      new ApiResponse(200, data, "Catalog tree fetched successfully")
    );
  }
);

/** Departments with nested subcategories (IDs + slugs) — for admin UIs or integrations. */
export const listDepartmentStructure = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response) => {
    const rows = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        sortOrder: true,
        description: true,
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            sortOrder: true,
          },
        },
      },
    });
    return res.status(200).json(
      new ApiResponse(200, rows, "Department structure fetched successfully")
    );
  }
);
