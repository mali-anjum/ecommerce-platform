import { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError, UnauthorizedError } from "../utils/ApiError";
import { AuthenticatedRequest } from "../types/express";
import { Role } from "@prisma/client";

function parsePaging(pageRaw: unknown, limitRaw: unknown) {
  const page = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);
  const limit = Math.min(
    Math.max(1, parseInt(String(limitRaw ?? "20"), 10) || 20),
    100
  );
  return { page, limit, skip: (page - 1) * limit };
}

const roleAllowlist = new Set<Role>(["USER", "SELLER", "SUPER_ADMIN"]);

/**
 * Super-admin: list users with filters + pagination.
 */
const getAdminUsers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const requesterId = req.user?.userId;
    if (!requesterId) {
      return next(new UnauthorizedError("Unauthorized user"));
    }

    const { page, limit, skip } = parsePaging(req.query.page, req.query.limit);
    const q = String(req.query.q ?? "").trim();
    const role = String(req.query.role ?? "")
      .trim()
      .toUpperCase() as Role | "";
    const active = String(req.query.active ?? "")
      .trim()
      .toLowerCase();

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    if (role && roleAllowlist.has(role)) {
      where.role = role;
    }
    if (active === "true") {
      where.isActive = true;
    } else if (active === "false") {
      where.isActive = false;
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        },
        "Users fetched successfully"
      )
    );
  }
);

/**
 * Super-admin: toggle user active state.
 */
const setUserActiveState = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const requesterId = req.user?.userId;
    if (!requesterId) {
      return next(new UnauthorizedError("Unauthorized user"));
    }

    const { userId } = req.params;
    const { isActive } = req.body as { isActive?: boolean };
    if (typeof isActive !== "boolean") {
      return next(new ApiError(400, "isActive (boolean) is required"));
    }
    if (userId === requesterId && isActive === false) {
      return next(new ApiError(400, "You cannot deactivate your own account"));
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updated, "User status updated successfully"));
  }
);

/**
 * Super-admin: update user role.
 */
const setUserRole = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const requesterId = req.user?.userId;
    if (!requesterId) {
      return next(new UnauthorizedError("Unauthorized user"));
    }

    const { userId } = req.params;
    const role = String(req.body?.role ?? "")
      .trim()
      .toUpperCase() as Role;
    if (!roleAllowlist.has(role)) {
      return next(new ApiError(400, "Invalid role value"));
    }
    if (userId === requesterId && role !== "SUPER_ADMIN") {
      return next(new ApiError(400, "You cannot demote your own role"));
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updated, "User role updated successfully"));
  }
);

export { getAdminUsers, setUserActiveState, setUserRole };
