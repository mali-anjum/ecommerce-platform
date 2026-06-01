import { prisma } from "../../../lib/prisma";
import {
  isSellableIndexEntry,
  mapProductToIndexEntry,
} from "./productIndexMapper";
import { productIndexStore } from "./productIndexStore";
import type { AiProductIndexEntry, ProductIndexStats } from "./types";

export function isProductIndexReady(): boolean {
  return productIndexStore.isReady();
}

export function getProductIndexStats(): ProductIndexStats {
  return productIndexStore.stats();
}

export async function warmProductIndex(): Promise<number> {
  const products = await prisma.product.findMany();
  const entries = products.map(mapProductToIndexEntry);
  productIndexStore.replaceAll(entries);
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
    return;
  }

  productIndexStore.upsert(mapProductToIndexEntry(product));
  productIndexStore.markReady();
}

export function removeProductIndexEntry(productId: string): void {
  productIndexStore.remove(productId);
}

export function scheduleProductIndexSync(productId: string): void {
  void syncProductIndexEntry(productId).catch((error) => {
    console.error(`[product-index] Failed to sync product ${productId}`, error);
  });
}

export function scheduleProductIndexRebuild(): void {
  void rebuildProductIndex().catch((error) => {
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
