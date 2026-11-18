import { useEffect, useState, useCallback, useMemo } from 'react';
import { CartItem, CartItemWithProduct } from '@/components/storefront/cart/types/cartItemStore';
import { useCartSelectionStore } from '@/components/storefront/cart/state/useCartSelectionStore';

export const useCheckoutCart = (items: CartItem[]) => {
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<CartItemWithProduct[]>([]);
  const selectedIds = useCartSelectionStore((state) => state.selectedIds);

  const convertToCartItemWithProduct = useCallback((item: CartItem): CartItemWithProduct => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    product: {
      id: item.productId,
      name: item.name || "Product",
      price: item.price || 0,
      category: item.category || "General",
      images: item.image ? [item.image] : [],
    },
  }), []);

  useEffect(() => {
    if (!Array.isArray(items)) {
      setCartItemsWithDetails([]);
      return;
    }

    if (items.length === 0) {
      setCartItemsWithDetails([]);
      return;
    }

    const convertedItems = items.map(convertToCartItemWithProduct);
    setCartItemsWithDetails(convertedItems);
  }, [items, convertToCartItemWithProduct]);

  const selectedCartItemsWithDetails = useMemo(() => {
    if (selectedIds.length === 0) {
      return [];
    }
    const selected = new Set(selectedIds);
    return cartItemsWithDetails.filter((item) => selected.has(item.id));
  }, [cartItemsWithDetails, selectedIds]);

  return {
    cartItemsWithDetails: selectedCartItemsWithDetails,
    allCartItemsWithDetails: cartItemsWithDetails,
  };
};
