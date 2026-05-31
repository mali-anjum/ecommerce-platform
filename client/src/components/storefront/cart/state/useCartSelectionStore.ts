import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartSelectionStore {
  selectedIds: string[];
  toggleItem: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  pruneInvalidIds: (validIds: string[]) => void;
  isSelected: (id: string) => boolean;
}

export const useCartSelectionStore = create<CartSelectionStore>()(
  persist(
    (set, get) => ({
      selectedIds: [],

      toggleItem: (id) => {
        const { selectedIds } = get();
        set({
          selectedIds: selectedIds.includes(id)
            ? selectedIds.filter((itemId) => itemId !== id)
            : [...selectedIds, id],
        });
      },

      setSelectedIds: (ids) => set({ selectedIds: [...new Set(ids)] }),

      selectAll: (ids) => set({ selectedIds: [...new Set(ids)] }),

      clearSelection: () => set({ selectedIds: [] }),

      pruneInvalidIds: (validIds) => {
        const valid = new Set(validIds);
        const pruned = get().selectedIds.filter((id) => valid.has(id));
        set({ selectedIds: pruned });
      },

      isSelected: (id) => get().selectedIds.includes(id),
    }),
    { name: "checkout-cart-selection" }
  )
);
