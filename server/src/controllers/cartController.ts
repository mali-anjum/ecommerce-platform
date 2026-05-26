import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { requireUserId } from "../utils/requireUserId";
import { CartService } from "../services/cart/get-cart-item";

const addToCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("Entered successfully.");
    const userId = requireUserId(req);

    const { productId, quantity, size, color } = req.body;
    if (!productId || !quantity) {
      return res
        .status(400)
        .json(new ApiError(400, "Product ID and quantity are required"));
    }

    const productExisted = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!productExisted) {
      return res
        .status(404)
        .json(new ApiError(404, "Product does not exist in the database"));
    }
    if (quantity <= 0) {
      return res
        .status(400)
        .json(new ApiError(400, "Quantity must be greater than 0"));
    }

    const normalizedSize =
      typeof size === "string" && size.trim().length > 0 ? size.trim() : null;
    const normalizedColor =
      typeof color === "string" && color.trim().length > 0 ? color.trim() : null;

    const sizeOptions = productExisted.sizes ?? [];
    const colorOptions = productExisted.colors ?? [];

    if (sizeOptions.length > 0) {
      if (!normalizedSize) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              "This product requires a size selection before adding to cart"
            )
          );
      }

      const selectedSizeIsValid = sizeOptions.some(
        (item) => item.toLowerCase() === normalizedSize.toLowerCase()
      );

      if (!selectedSizeIsValid) {
        return res
          .status(400)
          .json(new ApiError(400, "Selected size is not available for this product"));
      }
    }

    if (colorOptions.length > 0) {
      if (!normalizedColor) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              "This product requires a color selection before adding to cart"
            )
          );
      }

      const selectedColorIsValid = colorOptions.some(
        (item) => item.toLowerCase() === normalizedColor.toLowerCase()
      );

      if (!selectedColorIsValid) {
        return res
          .status(400)
          .json(new ApiError(400, "Selected color is not available for this product"));
      }
    }

    const cartColorValue = colorOptions.length > 0 ? normalizedColor! : "Default";
    const cartSizeValue = sizeOptions.length > 0 ? normalizedSize! : "";

    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    console.log("This is cart: ", cart);

    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId_size_color: {
          cartId: cart.id,
          productId,
          size: cartSizeValue,
          color: cartColorValue,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
        size: cartSizeValue,
        color: cartColorValue,
      },
    });

    console.log("My cart item", cartItem);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, price: true, images: true },
    });

    const responseItem = {
      id: cartItem.id,
      productId: cartItem.productId,
      name: product?.name,
      price: product?.price,
      image: product?.images?.[0] ?? null,
      color: cartItem.color,
      size: cartItem.size,
      quantity: cartItem.quantity,
    };

    return res
      .status(201)
      .json(new ApiResponse(200, responseItem, "Item added to cart."));
  }
);

const getCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = requireUserId(req);

      const cart = await CartService.getOrCreateCart(userId);
      const validationIssues = await CartService.validateCartItems(cart.items);

      const cartItems = cart.items
        .filter((item) => item.product !== null)
        .map((item) => ({
          id: item.id,
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images[0],
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          maxQuantity: item.product.stock,
          isAvailable: item.product.stock >= item.quantity,
          isFeatured: item.product.isFeatured,
        }));

      res.status(200).json(
        new ApiResponse(
          200,
          {
            items: cartItems,
            validationIssues,
            totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: cartItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ),
          },
          "Cart fetched successfully"
        )
      );
    } catch (error) {
      console.error("❌ getCart error:", error);
      res.status(500).json(new ApiError(500, "Failed to fetch cart"));
    }
  }
);

const removeFromCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(new ApiError(400, "Item id is required"));
    }

    await prisma.cartItem.delete({
      where: {
        id,
        cart: { userId },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Item removed from cart successfully"));
  }
);

const updateCartItemQuantity = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { quantity } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(new ApiError(400, "Item id is required"));
    }

    if (typeof quantity !== "number" || quantity < 1) {
      return res
        .status(400)
        .json(new ApiError(400, "Valid quantity is required"));
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: {
        id,
        cart: { userId },
      },
      data: { quantity },
    });

    const product = await prisma.product.findUnique({
      where: { id: updatedCartItem.productId },
      select: {
        images: true,
        name: true,
        price: true,
      },
    });

    const responseItem = {
      id: updatedCartItem.id,
      productId: updatedCartItem.productId,
      name: product?.name,
      price: product?.price,
      image: product?.images[0],
      color: updatedCartItem.color,
      size: updatedCartItem.size,
      quantity: updatedCartItem.quantity,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          responseItem,
          "Cart item quantity updated successfully"
        )
      );
  }
);
// all the items in the cart with the userId - for 1 item use delete()
const clearEntireCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req, "Unauthenticated user");

    await prisma.cartItem.deleteMany({
      where: {
        cart: { userId },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "cart cleared successfully!"));
  }
);

export {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  clearEntireCart,
};
