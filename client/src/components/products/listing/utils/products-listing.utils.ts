/** Maps UI tab ids to backend `collection` query (see productController.getProductsForClient). */
export function toApiCollection(tab: string): string | undefined {
  if (tab === "all") return undefined;
  if (tab === "ai") return "featured";
  return tab;
}

export type ProductCollectionTabId =
  | "all"
  | "new"
  | "trending"
  | "bestsellers"
  | "ai";
