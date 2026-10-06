jest.mock("../../../../lib/prisma", () => ({
  prisma: { product: { findMany: jest.fn(), findUnique: jest.fn() } },
}));
jest.mock("../../../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../productIndexPersistence", () => ({
  loadPersistedProductIndex: jest.fn(),
  persistProductIndexEntries: jest.fn(),
  persistProductIndexEntry: jest.fn(),
  removePersistedProductIndexEntry: jest.fn(),
}));

import type { Product } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import * as persistence from "../productIndexPersistence";
import { productIndexStore } from "../productIndexStore";
import {
  getProductIndexEntry,
  getProductIndexStats,
  isProductIndexReady,
  listAllProductIndexEntries,
  listSellableProductIndexEntries,
  rebuildProductIndex,
  removeProductIndexEntry,
  syncProductIndexEntry,
  warmProductIndex,
} from "../productIndexSync";
import { mapProductToIndexEntry } from "../productIndexMapper";

const findMany = prisma.product.findMany as jest.Mock;
const findUnique = prisma.product.findUnique as jest.Mock;
const loadPersisted = persistence.loadPersistedProductIndex as jest.Mock;
const persistAll = persistence.persistProductIndexEntries as jest.Mock;
const persistOne = persistence.persistProductIndexEntry as jest.Mock;
const removePersisted = persistence.removePersistedProductIndexEntry as jest.Mock;

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "MacBook Air M2",
    brand: "Apple",
    description: "Laptop",
    category: "Laptops",
    condition: "NEW",
    price: 1000,
    stock: 5,
    discountPercent: 10,
    images: ["https://img/1.jpg"],
    soldCount: 0,
    rating: 4.5,
    isFeatured: false,
    isActive: true,
    isArchived: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  } as Product;
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("productIndexSync", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productIndexStore.clear();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    persistAll.mockResolvedValue(undefined);
    persistOne.mockResolvedValue(undefined);
    removePersisted.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("warmProductIndex", () => {
    it("hydrates from the persisted snapshot without querying products", async () => {
      loadPersisted.mockResolvedValue([mapProductToIndexEntry(product())]);
      await expect(warmProductIndex()).resolves.toBe(1);
      expect(findMany).not.toHaveBeenCalled();
      expect(isProductIndexReady()).toBe(true);
    });

    it("rebuilds from products when the snapshot is empty", async () => {
      loadPersisted.mockResolvedValue([]);
      findMany.mockResolvedValue([product(), product({ id: "p2" })]);
      await expect(warmProductIndex()).resolves.toBe(2);
      expect(persistAll).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "p2" })]));
    });

    it("rebuilds from products when loading the snapshot fails", async () => {
      loadPersisted.mockRejectedValue(new Error("table missing"));
      findMany.mockResolvedValue([product()]);
      await expect(warmProductIndex()).resolves.toBe(1);
      expect(getProductIndexEntry("p1")?.effectivePrice).toBe(900);
    });

    it("keeps the in-memory index when persisting the rebuild fails", async () => {
      loadPersisted.mockResolvedValue([]);
      findMany.mockResolvedValue([product()]);
      persistAll.mockRejectedValue(new Error("db down"));
      await expect(warmProductIndex()).resolves.toBe(1);
      expect(getProductIndexStats()).toMatchObject({ ready: true, count: 1 });
    });
  });

  describe("rebuildProductIndex", () => {
    it("ignores a stale persisted snapshot and reads current products", async () => {
      loadPersisted.mockResolvedValue([mapProductToIndexEntry(product({ isFeatured: false }))]);
      findMany.mockResolvedValue([product({ isFeatured: true })]);

      await expect(rebuildProductIndex()).resolves.toBe(1);
      expect(loadPersisted).not.toHaveBeenCalled();
      expect(getProductIndexEntry("p1")?.isFeatured).toBe(true);
    });
  });

  describe("syncProductIndexEntry", () => {
    it("upserts an active product and persists it", async () => {
      findUnique.mockResolvedValue(product({ name: "Updated" }));
      await syncProductIndexEntry("p1");
      expect(getProductIndexEntry("p1")?.name).toBe("Updated");
      expect(persistOne).toHaveBeenCalledWith(expect.objectContaining({ id: "p1", name: "Updated" }));
      expect(removePersisted).not.toHaveBeenCalled();
    });

    it.each([
      ["deleted", null],
      ["inactive", product({ isActive: false })],
      ["archived", product({ isArchived: true })],
    ])("removes a %s product from memory and storage", async (_label, row) => {
      productIndexStore.upsert(mapProductToIndexEntry(product()));
      findUnique.mockResolvedValue(row);
      await syncProductIndexEntry("p1");
      expect(getProductIndexEntry("p1")).toBeUndefined();
      expect(removePersisted).toHaveBeenCalledWith("p1");
      expect(persistOne).not.toHaveBeenCalled();
    });

    it("does not throw when persistence fails", async () => {
      findUnique.mockResolvedValue(product());
      persistOne.mockRejectedValue(new Error("db down"));
      await expect(syncProductIndexEntry("p1")).resolves.toBeUndefined();
      expect(getProductIndexEntry("p1")).toBeDefined();
    });
  });

  it("removeProductIndexEntry drops the entry and swallows storage errors", async () => {
    productIndexStore.upsert(mapProductToIndexEntry(product()));
    removePersisted.mockRejectedValue(new Error("db down"));
    removeProductIndexEntry("p1");
    await flush();
    expect(getProductIndexEntry("p1")).toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("lists only sellable entries (active, not archived, in stock)", () => {
    productIndexStore.replaceAll([
      mapProductToIndexEntry(product({ id: "ok" })),
      mapProductToIndexEntry(product({ id: "oos", stock: 0 })),
      mapProductToIndexEntry(product({ id: "off", isActive: false })),
      mapProductToIndexEntry(product({ id: "arch", isArchived: true })),
    ]);
    expect(listSellableProductIndexEntries().map((e) => e.id)).toEqual(["ok"]);
    expect(listAllProductIndexEntries()).toHaveLength(4);
  });

  it("is not ready while empty even after markReady", () => {
    productIndexStore.markReady();
    expect(isProductIndexReady()).toBe(false);
    expect(getProductIndexStats()).toMatchObject({ ready: false, count: 0 });
  });
});
