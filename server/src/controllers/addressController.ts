import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireUserId } from "../utils/requireUserId";
import type { AddressInput } from "../validations/addressSchema";

const createAddress = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = requireUserId(req, "Unauthenticated user");

    // Validated and trimmed by `validate(addressSchema)` on the route.
    const { name, address, city, country, postalCode, phone, isDefault } =
      req.validatedData as AddressInput;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: {
          isDefault: false,
        },
      });
    }

    const newlyCreatedAddress = await prisma.address.create({
      data: {
        userId,
        name,
        address,
        city,
        country,
        postalCode,
        phone,
        isDefault,
      },
    });

    res.status(201).json({
      success: true,
      address: newlyCreatedAddress,
    });
  },
);

const getAddresses = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = requireUserId(req, "Unauthenticated user");

    const fetchAllAddresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      address: fetchAllAddresses,
    });
  },
);

const updateAddress = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = requireUserId(req, "Unauthenticated user");
    const { id } = req.params;

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existingAddress) {
      res.status(404).json({
        success: false,
        message: "Address not found!",
      });

      return;
    }

    // Validated and trimmed by `validate(addressSchema)` on the route.
    const { name, address, city, country, postalCode, phone, isDefault } =
      req.validatedData as AddressInput;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        name,
        address,
        city,
        country,
        postalCode,
        phone,
        isDefault,
      },
    });

    res.status(200).json({
      success: true,
      address: updatedAddress,
    });
  },
);

const deleteAddress = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = requireUserId(req, "Unauthenticated user");
    const { id } = req.params;

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existingAddress) {
      res.status(404).json({
        success: false,
        message: "Address not found!",
      });

      return;
    }

    // Orders cascade-delete with their address (schema onDelete: Cascade),
    // so an address used by any order must never be deleted.
    const linkedOrders = await prisma.order.count({ where: { addressId: id } });
    if (linkedOrders > 0) {
      res.status(409).json({
        success: false,
        message: "This address is linked to existing orders and cannot be deleted.",
      });
      return;
    }

    await prisma.address.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Address deleted successfully!",
    });
  },
);

export { createAddress, getAddresses, updateAddress, deleteAddress };
