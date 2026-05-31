export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  maxQuantity?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  category?: string;
}

export interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    images: string[];
  };
}

export interface CartStoreState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, "id">) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateCartItemQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}