import { useCallback, useEffect, useMemo } from "react";
import { useCartSelectionStore } from "@/store/useCartSelectionStore";

type CartLine = {
  id: string;
};

export function useCartSelection<T extends CartLine>(cartItems: T[]) {
  const {
    selectedIds,
    toggleItem,
    selectAll,
    clearSelection,
    pruneInvalidIds,
    isSelected,
    setSelectedIds,
  } = useCartSelectionStore();

  const cartItemIds = useMemo(
    () => cartItems.map((item) => item.id),
    [cartItems]
  );

  useEffect(() => {
    if (cartItemIds.length === 0) {
      clearSelection();
      return;
    }

    pruneInvalidIds(cartItemIds);

    if (selectedIds.length === 0) {
      selectAll(cartItemIds);
    }
  }, [
    cartItemIds,
    clearSelection,
    pruneInvalidIds,
    selectAll,
    selectedIds.length,
  ]);

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedIds.includes(item.id)),
    [cartItems, selectedIds]
  );

  const allSelected =
    cartItemIds.length > 0 &&
    cartItemIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection();
      return;
    }
    selectAll(cartItemIds);
  }, [allSelected, cartItemIds, clearSelection, selectAll]);

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedItems.length,
    hasSelection: selectedItems.length > 0,
    allSelected,
    toggleItem,
    toggleSelectAll,
    isSelected,
    setSelectedIds,
  };
}
