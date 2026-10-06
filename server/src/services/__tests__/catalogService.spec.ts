const deptUpsert = jest.fn();
const deptFindMany = jest.fn();
const deptFindUnique = jest.fn();
const deptFindFirst = jest.fn();
const subUpsert = jest.fn();
const subFindMany = jest.fn();
const subFindUnique = jest.fn();
const subFindFirst = jest.fn();
const productUpdateMany = jest.fn();
const productCount = jest.fn();

jest.mock("../../lib/prisma", () => ({
  __esModule: true,
  default: {
    department: {
      upsert: (...a: unknown[]) => deptUpsert(...a),
      findMany: (...a: unknown[]) => deptFindMany(...a),
      findUnique: (...a: unknown[]) => deptFindUnique(...a),
      findFirst: (...a: unknown[]) => deptFindFirst(...a),
    },
    subcategory: {
      upsert: (...a: unknown[]) => subUpsert(...a),
      findMany: (...a: unknown[]) => subFindMany(...a),
      findUnique: (...a: unknown[]) => subFindUnique(...a),
      findFirst: (...a: unknown[]) => subFindFirst(...a),
    },
    product: {
      updateMany: (...a: unknown[]) => productUpdateMany(...a),
      count: (...a: unknown[]) => productCount(...a),
    },
  },
}));

import {
  buildCatalogWhereFragment,
  buildCatalogWhereFragmentFromTitles,
  getCatalogTreeWithCounts,
  invalidateCatalogTreeCache,
  linkOrphanProductsToSubcategories,
  upsertCatalogFromConstants,
} from "../catalogService";
import { PRODUCT_CATEGORY_CATALOG } from "../../constants/productCategories";

const EMPTY = { id: { in: [] } };
const bySub = (id: string, title: string) => ({
  OR: [
    { subcategoryId: id },
    { AND: [{ subcategoryId: null }, { category: { equals: title, mode: "insensitive" } }] },
  ],
});

beforeEach(() => {
  jest.clearAllMocks();
  invalidateCatalogTreeCache();
});

describe("upsertCatalogFromConstants", () => {
  it("upserts every department and subcategory with sort order", async () => {
    deptUpsert.mockImplementation(async ({ create }) => ({ id: `d-${create.slug}` }));
    const result = await upsertCatalogFromConstants();
    const subTotal = PRODUCT_CATEGORY_CATALOG.reduce((n, d) => n + d.subcategories.length, 0);
    expect(result).toEqual({ departmentsUpserted: PRODUCT_CATEGORY_CATALOG.length, subcategoriesUpserted: subTotal });
    expect(deptUpsert.mock.calls[1][0]).toMatchObject({ where: { slug: "fashion" }, update: { sortOrder: 1, isActive: true } });
    expect(subUpsert.mock.calls[0][0].where).toEqual({ departmentId_slug: { departmentId: "d-electronics", slug: "smartphones" } });
  });
});

describe("linkOrphanProductsToSubcategories", () => {
  it("links unlinked products by case-insensitive category title and sums counts", async () => {
    subFindMany.mockResolvedValueOnce([{ id: "s1", title: "Laptops" }, { id: "s2", title: "Audio" }]);
    productUpdateMany.mockResolvedValueOnce({ count: 3 }).mockResolvedValueOnce({ count: 0 });
    await expect(linkOrphanProductsToSubcategories()).resolves.toBe(3);
    expect(productUpdateMany.mock.calls[0][0]).toEqual({
      where: { subcategoryId: null, category: { equals: "Laptops", mode: "insensitive" } },
      data: { subcategoryId: "s1" },
    });
  });
});

describe("getCatalogTreeWithCounts", () => {
  const tree = [
    { id: "d1", title: "Electronics", slug: "electronics", subcategories: [{ id: "s1", title: "Laptops", slug: "laptops" }] },
  ];

  it("sums FK, legacy-subcategory and legacy-department counts of visible products only", async () => {
    deptFindMany.mockResolvedValueOnce(tree);
    productCount
      .mockResolvedValueOnce(4) // linked to s1
      .mockResolvedValueOnce(1) // legacy "Laptops" without FK
      .mockResolvedValueOnce(2); // legacy "Electronics"
    const result = await getCatalogTreeWithCounts();
    expect(result).toEqual([
      { title: "Electronics", slug: "electronics", productCount: 7, subcategories: [{ title: "Laptops", slug: "laptops", productCount: 5 }] },
    ]);
    for (const [args] of productCount.mock.calls) {
      expect(args.where).toMatchObject({ isActive: true, isArchived: false });
    }
  });

  it("serves from cache until invalidated", async () => {
    deptFindMany.mockResolvedValue([]);
    await getCatalogTreeWithCounts();
    await getCatalogTreeWithCounts();
    expect(deptFindMany).toHaveBeenCalledTimes(1);
    invalidateCatalogTreeCache();
    await getCatalogTreeWithCounts();
    expect(deptFindMany).toHaveBeenCalledTimes(2);
  });
});

describe("buildCatalogWhereFragment", () => {
  it("returns null without catalog params", async () => {
    await expect(buildCatalogWhereFragment({})).resolves.toBeNull();
  });

  it("filters by subcategory id", async () => {
    subFindUnique.mockResolvedValueOnce({ title: "Laptops" });
    await expect(buildCatalogWhereFragment({ subcategoryId: " s1 " })).resolves.toEqual(bySub("s1", "Laptops"));
  });

  it("matches nothing for an unknown subcategory id", async () => {
    subFindUnique.mockResolvedValueOnce(null);
    await expect(buildCatalogWhereFragment({ subcategoryId: "zzz" })).resolves.toEqual(EMPTY);
  });

  it("filters by subcategory slug alone", async () => {
    subFindFirst.mockResolvedValueOnce({ id: "s1", title: "Laptops" });
    await expect(buildCatalogWhereFragment({ subcategorySlug: "laptops" })).resolves.toEqual(bySub("s1", "Laptops"));
  });

  it("scopes a subcategory slug to an active department", async () => {
    subFindFirst.mockResolvedValueOnce(null);
    await expect(buildCatalogWhereFragment({ departmentSlug: "fashion", subcategorySlug: "laptops" })).resolves.toEqual(EMPTY);
    expect(subFindFirst.mock.calls[0][0].where).toEqual({ slug: "laptops", department: { slug: "fashion", isActive: true } });
  });

  it("expands a department into its subcategories plus legacy titles", async () => {
    deptFindUnique.mockResolvedValueOnce({ title: "Electronics", subcategories: [{ id: "s1", title: "Laptops" }] });
    await expect(buildCatalogWhereFragment({ departmentSlug: "electronics" })).resolves.toEqual({
      OR: [
        { subcategoryId: { in: ["s1"] } },
        { subcategoryId: null, category: { in: ["Electronics", "Laptops"], mode: "insensitive" } },
      ],
    });
  });

  it("matches nothing for an unknown department", async () => {
    deptFindUnique.mockResolvedValueOnce(null);
    await expect(buildCatalogWhereFragment({ departmentSlug: "garden" })).resolves.toEqual(EMPTY);
  });
});

describe("buildCatalogWhereFragmentFromTitles", () => {
  it("returns null without titles", async () => {
    await expect(buildCatalogWhereFragmentFromTitles({})).resolves.toBeNull();
  });

  it("resolves main + sub titles case-insensitively", async () => {
    subFindFirst.mockResolvedValueOnce({ id: "s1", title: "Laptops" });
    await expect(buildCatalogWhereFragmentFromTitles({ mainCategory: "electronics", subcategory: "laptops" })).resolves.toEqual(
      bySub("s1", "Laptops"),
    );
  });

  it("expands a main category", async () => {
    deptFindFirst.mockResolvedValueOnce({ title: "Beauty", subcategories: [] });
    await expect(buildCatalogWhereFragmentFromTitles({ mainCategory: "Beauty" })).resolves.toEqual({
      OR: [{ subcategoryId: null, category: { in: ["Beauty"], mode: "insensitive" } }],
    });
  });

  it("resolves a subcategory alone", async () => {
    subFindFirst.mockResolvedValueOnce({ id: "s2", title: "Audio" });
    await expect(buildCatalogWhereFragmentFromTitles({ subcategory: "audio" })).resolves.toEqual(bySub("s2", "Audio"));
  });

  it("returns null for unknown titles so the caller can fall back", async () => {
    subFindFirst.mockResolvedValueOnce(null);
    deptFindFirst.mockResolvedValueOnce(null);
    await expect(buildCatalogWhereFragmentFromTitles({ mainCategory: "x", subcategory: "y" })).resolves.toBeNull();
    await expect(buildCatalogWhereFragmentFromTitles({ mainCategory: "x" })).resolves.toBeNull();
  });
});
