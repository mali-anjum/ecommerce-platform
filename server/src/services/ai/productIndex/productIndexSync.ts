import { prisma } from "../../../lib/prisma";
import {
  isSellableIndexEntry,
  mapProductToIndexEntry,
} from "./productIndexMapper";
import {
  loadPersistedProductIndex,
  persistProductIndexEntries,
  persistProductIndexEntry,
  removePersistedProductIndexEntry,
} from "./productIndexPersistence";
import { productIndexStore } from "./productIndexStore";
import type { AiProductIndexEntry, ProductIndexStats } from "./types";
import { sentryTracker } from "../../../lib/monitoring";

export function isProductIndexReady(): boolean {
  return productIndexStore.isReady();
}

export function getProductIndexStats(): ProductIndexStats {
  return productIndexStore.stats();
}

async function hydrateFromDatabase(): Promise<number> {
  const persisted = await loadPersistedProductIndex();
  if (persisted.length === 0) {
    return 0;
  }
  productIndexStore.replaceAll(persisted);
  return persisted.length;
}

export async function warmProductIndex(): Promise<number> {
  try {
    const hydrated = await hydrateFromDatabase();
    if (hydrated > 0) {
      return hydrated;
    }
  } catch (error) {
    sentryTracker(error, { source: "productIndexSync" });
    console.error("[product-index] Failed to load persisted index", error);
  }

  const products = await prisma.product.findMany();
  const entries = products.map(mapProductToIndexEntry);
  productIndexStore.replaceAll(entries);

  try {
    await persistProductIndexEntries(entries);
  } catch (error) {
    sentryTracker(error, { source: "productIndexSync" });
    console.error("[product-index] Failed to persist rebuilt index", error);
  }

  return entries.length;
}

export async function rebuildProductIndex(): Promise<number> {
  return warmProductIndex();
}

export async function syncProductIndexEntry(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive || product.isArchived) {
    productIndexStore.remove(productId);
    productIndexStore.markReady();
    try {
      await removePersistedProductIndexEntry(productId);
    } catch (error) {
    sentryTracker(error, { source: "productIndexSync" });
      console.error(
        `[product-index] Failed to remove persisted entry ${productId}`,
        error,
      );
    }
    return;
  }

  const entry = mapProductToIndexEntry(product);
  productIndexStore.upsert(entry);
  productIndexStore.markReady();

  try {
    await persistProductIndexEntry(entry);
  } catch (error) {
    sentryTracker(error, { source: "productIndexSync" });
    console.error(
      `[product-index] Failed to persist entry ${productId}`,
      error,
    );
  }
}

export function removeProductIndexEntry(productId: string): void {
  productIndexStore.remove(productId);
  void removePersistedProductIndexEntry(productId).catch((error) => {
    sentryTracker(error, { source: "productIndexSync" });
    console.error(
      `[product-index] Failed to remove persisted entry ${productId}`,
      error,
    );
  });
}

export function scheduleProductIndexSync(productId: string): void {
  void syncProductIndexEntry(productId).catch((error) => {
    sentryTracker(error, { source: "productIndexSync" });
    console.error(`[product-index] Failed to sync product ${productId}`, error);
  });
}

export function scheduleProductIndexRebuild(): void {
  void rebuildProductIndex().catch((error) => {
    sentryTracker(error, { source: "productIndexSync" });
    console.error("[product-index] Failed to rebuild index", error);
  });
}

export function getProductIndexEntry(
  productId: string,
): AiProductIndexEntry | undefined {
  return productIndexStore.get(productId);
}

export function listSellableProductIndexEntries(): AiProductIndexEntry[] {
  return productIndexStore.list().filter(isSellableIndexEntry);
}

export function listAllProductIndexEntries(): AiProductIndexEntry[] {
  return productIndexStore.list();
}
