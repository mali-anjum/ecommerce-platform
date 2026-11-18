import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { MinimalProduct } from "../interfaces/product";

export type ValidatedCheckoutCartItem = MinimalProduct & {
  cartItemId: string;
};

function normalizeCartItemIds(cartItemIds: unknown): string[] {
  if (!Array.isArray(cartItemIds)) {
    throw new ApiError(400, "cartItemIds must be a non-empty array");
  }

  const ids = [
    ...new Set(
      cartItemIds
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter((id) => id.length > 0)
    ),
  ];

  if (ids.length === 0) {
    throw new ApiError(400, "At least one cart item must be selected for checkout");
  }

  return ids;
}
// validate the checkout selection by the cart item ids with zod
export async function validateCheckoutSelection(
  userId: string,
  cartItemIds: unknown
): Promise<ValidatedCheckoutCartItem[]> {
  const ids = normalizeCartItemIds(cartItemIds);

  const cartItems = await prisma.cartItem.findMany({
    where: {
      id: { in: ids },
      cart: { userId },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
          stock: true,
        },
      },
    },
  });

  if (cartItems.length !== ids.length) {
    throw new ApiError(
      400,
      "One or more selected cart items are invalid or do not belong to your cart"
    );
  }

  const byId = new Map(cartItems.map((item) => [item.id, item]));

  const validated: ValidatedCheckoutCartItem[] = [];

  for (const id of ids) {
    const item = byId.get(id);
    if (!item?.product) {
      throw new ApiError(400, "A selected product is no longer available");
    }

    if (item.product.stock < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`
      );
    }

    if (item.product.stock === 0) {
      throw new ApiError(400, `${item.product.name} is out of stock`);
    }

    validated.push({
      cartItemId: item.id,
      productId: item.product.id,
      productName: item.product.name,
      productCategory: item.product.category,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: item.product.price,
    });
  }

  return validated;
}
