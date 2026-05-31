import { useCallback, useEffect, useMemo, useRef } from "react";
import { useCartSelectionStore } from "@/components/storefront/cart/state/useCartSelectionStore";

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

  const cartIdsKey = cartItemIds.join("|");
  const initializedForCartRef = useRef<string | null>(null);

  useEffect(() => {
    if (cartItemIds.length === 0) {
      clearSelection();
      initializedForCartRef.current = null;
      return;
    }

    // Only auto-select all on first load for this cart (not after user clears selection).
    if (initializedForCartRef.current !== cartIdsKey) {
      initializedForCartRef.current = cartIdsKey;
      pruneInvalidIds(cartItemIds);
      const validSelection = useCartSelectionStore
        .getState()
        .selectedIds.filter((id) => cartItemIds.includes(id));

      if (validSelection.length === 0) {
        selectAll(cartItemIds);
      } else {
        setSelectedIds(validSelection);
      }
      return;
    }

    pruneInvalidIds(cartItemIds);
  }, [
    cartIdsKey,
    cartItemIds,
    clearSelection,
    pruneInvalidIds,
    selectAll,
    setSelectedIds,
  ]);

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedIds.includes(item.id)),
    [cartItems, selectedIds]
  );

  const allSelected =
    cartItemIds.length > 0 &&
    cartItemIds.every((id) => selectedIds.includes(id));

  const someSelected =
    selectedIds.length > 0 && !allSelected;

  const selectAllChecked: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  const toggleSelectAll = useCallback(
    (checked: boolean | "indeterminate") => {
      if (checked === true) {
        selectAll(cartItemIds);
        return;
      }
      clearSelection();
    },
    [cartItemIds, clearSelection, selectAll]
  );

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedItems.length,
    hasSelection: selectedItems.length > 0,
    allSelected,
    someSelected,
    selectAllChecked,
    toggleItem,
    toggleSelectAll,
    isSelected,
    setSelectedIds,
  };
}
