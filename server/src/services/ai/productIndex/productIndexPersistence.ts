import { prisma } from "../../../lib/prisma";
import type { AiProductIndexEntry } from "./types";

const META_ID = "default";

export async function loadPersistedProductIndex(): Promise<AiProductIndexEntry[]> {
  const rows = await prisma.aiProductSearchIndex.findMany({
    select: { payload: true },
  });

  return rows
    .map((row) => row.payload as AiProductIndexEntry)
    .filter((entry) => entry && typeof entry.id === "string");
}
// TODO: For performance check this whether for loop is better or Promise.all
export async function persistProductIndexEntries(
  entries: AiProductIndexEntry[],
): Promise<void> {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const existingIds = await tx.aiProductSearchIndex.findMany({
      select: { productId: true },
    });
    const existingSet = new Set(existingIds.map((row) => row.productId));
    const nextSet = new Set(entries.map((entry) => entry.id));

    const toDelete = [...existingSet].filter((id) => !nextSet.has(id));
    if (toDelete.length > 0) {
      await tx.aiProductSearchIndex.deleteMany({
        where: { productId: { in: toDelete } },
      });
    }

    for (const entry of entries) {
      await tx.aiProductSearchIndex.upsert({
        where: { productId: entry.id },
        create: {
          productId: entry.id,
          payload: entry as object,
          updatedAt: now,
        },
        update: {
          payload: entry as object,
          updatedAt: now,
        },
      });
    }

    await tx.aiProductSearchIndexMeta.upsert({
      where: { id: META_ID },
      create: {
        id: META_ID,
        lastSyncedAt: now,
        entryCount: entries.length,
      },
      update: {
        lastSyncedAt: now,
        entryCount: entries.length,
      },
    });
  });
}

export async function persistProductIndexEntry(
  entry: AiProductIndexEntry,
): Promise<void> {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.aiProductSearchIndex.upsert({
      where: { productId: entry.id },
      create: {
        productId: entry.id,
        payload: entry as object,
        updatedAt: now,
      },
      update: {
        payload: entry as object,
        updatedAt: now,
      },
    });

    const count = await tx.aiProductSearchIndex.count();
    await tx.aiProductSearchIndexMeta.upsert({
      where: { id: META_ID },
      create: { id: META_ID, lastSyncedAt: now, entryCount: count },
      update: { lastSyncedAt: now, entryCount: count },
    });
  });
}

export async function removePersistedProductIndexEntry(
  productId: string,
): Promise<void> {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.aiProductSearchIndex.deleteMany({ where: { productId } });
    const count = await tx.aiProductSearchIndex.count();
    await tx.aiProductSearchIndexMeta.upsert({
      where: { id: META_ID },
      create: { id: META_ID, lastSyncedAt: now, entryCount: count },
      update: { lastSyncedAt: now, entryCount: count },
    });
  });
}
