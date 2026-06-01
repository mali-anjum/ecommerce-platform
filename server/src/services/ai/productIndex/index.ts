export {
  getProductIndexStats,
  isProductIndexReady,
  warmProductIndex,
  rebuildProductIndex,
  syncProductIndexEntry,
  removeProductIndexEntry,
  scheduleProductIndexSync,
  scheduleProductIndexRebuild,
  getProductIndexEntry,
  listSellableProductIndexEntries,
} from "./productIndexSync";

export {
  searchAssistantProductsFromIndex,
  queryRecommendationsFromIndex,
} from "./productIndexQuery";

export type { AiProductIndexEntry, ProductIndexStats } from "./types";
