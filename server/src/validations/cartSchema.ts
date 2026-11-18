import { z } from 'zod';

// Base schemas for reusability
export const productIdSchema = z.string().min(1, "Product ID is required");
export const quantitySchema = z.number().min(1, "Quantity must be at least 1");
export const optionalStringSchema = z.string().optional().nullable();

// Add to Cart Schema
export const addToCartSchema = z.object({
  productId: productIdSchema,
  quantity: quantitySchema,
  // size: optionalStringSchema,
  // color: optionalStringSchema,
});

// Update Cart Item Schema
export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

// Remove from Cart Schema (for route params)
export const cartItemParamsSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
});

// Type inference for TypeScript
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemParams = z.infer<typeof cartItemParamsSchema>;