export type CartData = CartItem[] | {
  items: CartItem[];
  totalItems?: number;
  totalPrice?: number;
  validationIssues?: any[];
};

import type { CartItem } from "@/components/storefront/cart/types/cartItemStore";

export const getCartItemsArray = (cartData: CartData | undefined | null): CartItem[] => {
  if (!cartData) return [];
  
  if (Array.isArray(cartData)) {
    return cartData;
  }
  
  // Now TypeScript knows cartData is an object
  if ('items' in cartData && Array.isArray(cartData.items)) {
    return cartData.items;
  }
  
  // Try other possible property names
  if ('data' in cartData && Array.isArray(cartData.data)) {
    return cartData.data;
  }
  
  if ('cartItems' in cartData && Array.isArray(cartData.cartItems)) {
    return cartData.cartItems;
  }
  
  return [];
};