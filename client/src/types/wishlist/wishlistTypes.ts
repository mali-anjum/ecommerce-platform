export type WishlistAvailability =
  | "available"
  | "out_of_stock"
  | "unavailable";

export type WishlistItem = {
  id: string;
  productId: string;
  name: string;
  brand: string;
  category: string;
  thumbnail: string | null;
  price: number;
  salePrice: number | null;
  discountPercent: number | null;
  stock: number;
  availability: WishlistAvailability;
  isPurchasable: boolean;
  sizes: string[];
  colors: string[];
  addedAt: string;
};

export type WishlistResponse = {
  items: WishlistItem[];
  totalItems: number;
  totalValue: number;
};

export type ToggleWishlistResponse = {
  action: "added" | "removed";
  item: WishlistItem | null;
  productId: string;
};

export type WishlistProductSnapshot = {
  productId: string;
  name: string;
  brand?: string;
  category: string;
  thumbnail?: string | null;
  price: number;
  salePrice?: number | null;
  discountPercent?: number | null;
  stock?: number;
  availability?: WishlistAvailability;
  sizes?: string[];
  colors?: string[];
};
