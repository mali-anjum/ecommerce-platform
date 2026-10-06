const tx = {
  aiProductSearchIndex: { findMany: jest.fn(), deleteMany: jest.fn(), upsert: jest.fn(), count: jest.fn() },
  aiProductSearchIndexMeta: { upsert: jest.fn() },
};

jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    aiProductSearchIndex: { findMany: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  },
}));

import { prisma } from "../../../../lib/prisma";
import {
  loadPersistedProductIndex,
  persistProductIndexEntries,
  persistProductIndexEntry,
  removePersistedProductIndexEntry,
} from "../productIndexPersistence";
import type { AiProductIndexEntry } from "../types";

const entry = (id: string) => ({ id, name: id }) as AiProductIndexEntry;

describe("productIndexPersistence", () => {
  beforeEach(() => {
    for (const fn of [
      tx.aiProductSearchIndex.findMany,
      tx.aiProductSearchIndex.deleteMany,
      tx.aiProductSearchIndex.upsert,
      tx.aiProductSearchIndex.count,
      tx.aiProductSearchIndexMeta.upsert,
      prisma.aiProductSearchIndex.findMany as jest.Mock,
    ]) {
      fn.mockReset();
    }
  });

  it("loads payloads and drops malformed rows", async () => {
    (prisma.aiProductSearchIndex.findMany as jest.Mock).mockResolvedValue([
      { payload: entry("p1") },
      { payload: null },
      { payload: { name: "no id" } },
    ]);
    await expect(loadPersistedProductIndex()).resolves.toEqual([entry("p1")]);
  });

  it("replaces the snapshot: deletes stale rows, upserts current ones, updates meta", async () => {
    tx.aiProductSearchIndex.findMany.mockResolvedValue([{ productId: "p1" }, { productId: "stale" }]);

    await persistProductIndexEntries([entry("p1"), entry("p2")]);

    expect(tx.aiProductSearchIndex.deleteMany).toHaveBeenCalledWith({ where: { productId: { in: ["stale"] } } });
    expect(tx.aiProductSearchIndex.upsert).toHaveBeenCalledTimes(2);
    expect(tx.aiProductSearchIndex.upsert.mock.calls[1][0].where).toEqual({ productId: "p2" });
    expect(tx.aiProductSearchIndexMeta.upsert.mock.calls[0][0].update.entryCount).toBe(2);
  });

  it("skips deleteMany when nothing is stale", async () => {
    tx.aiProductSearchIndex.findMany.mockResolvedValue([{ productId: "p1" }]);
    await persistProductIndexEntries([entry("p1")]);
    expect(tx.aiProductSearchIndex.deleteMany).not.toHaveBeenCalled();
  });

  it("upserts one entry and records the real row count", async () => {
    tx.aiProductSearchIndex.count.mockResolvedValue(7);
    await persistProductIndexEntry(entry("p9"));
    expect(tx.aiProductSearchIndex.upsert.mock.calls[0][0].create).toMatchObject({ productId: "p9", payload: entry("p9") });
    expect(tx.aiProductSearchIndexMeta.upsert.mock.calls[0][0].create.entryCount).toBe(7);
  });

  it("removes one entry and records the remaining count", async () => {
    tx.aiProductSearchIndex.count.mockResolvedValue(3);
    await removePersistedProductIndexEntry("p1");
    expect(tx.aiProductSearchIndex.deleteMany).toHaveBeenCalledWith({ where: { productId: "p1" } });
    expect(tx.aiProductSearchIndexMeta.upsert.mock.calls[0][0].update.entryCount).toBe(3);
  });
});
