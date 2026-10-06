import { useMemo } from 'react';
import { CartItem, CartItemWithProduct } from '@/components/storefront/cart/types/cartItemStore';
import { useCartSelectionStore } from '@/components/storefront/cart/state/useCartSelectionStore';

export const toCartItemWithProduct = (item: CartItem): CartItemWithProduct => ({
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
});

/** Only the lines the shopper ticked in the cart go to checkout. */
export function selectCheckoutItems(
  items: CartItemWithProduct[],
  selectedIds: string[]
): CartItemWithProduct[] {
  if (selectedIds.length === 0) return [];
  const selected = new Set(selectedIds);
  return items.filter((item) => selected.has(item.id));
}

export const useCheckoutCart = (items: CartItem[]) => {
  const selectedIds = useCartSelectionStore((state) => state.selectedIds);

  const cartItemsWithDetails = useMemo(
    () => (Array.isArray(items) ? items.map(toCartItemWithProduct) : []),
    [items]
  );

  const selectedCartItemsWithDetails = useMemo(
    () => selectCheckoutItems(cartItemsWithDetails, selectedIds),
    [cartItemsWithDetails, selectedIds]
  );

  return {
    cartItemsWithDetails: selectedCartItemsWithDetails,
    allCartItemsWithDetails: cartItemsWithDetails,
  };
};
