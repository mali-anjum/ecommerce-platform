import { z } from "zod";
import { productIdSchema } from "./cartSchema";

export const toggleWishlistSchema = z.object({
  productId: productIdSchema,
});

export const wishlistItemParamsSchema = z.object({
  id: z.uuid("Invalid wishlist item id"),
});

export type ToggleWishlistInput = z.infer<typeof toggleWishlistSchema>;
