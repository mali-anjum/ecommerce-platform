const productFindMany = jest.fn();
const productCount = jest.fn();
const sellerFindMany = jest.fn();
const departmentCount = jest.fn();
const buildCatalogWhereFragment = jest.fn();
const buildCatalogWhereFragmentFromTitles = jest.fn();
const getCatalogTreeWithCounts = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    product: {
      findMany: (...a: unknown[]) => productFindMany(...a),
      count: (...a: unknown[]) => productCount(...a),
    },
    seller: { findMany: (...a: unknown[]) => sellerFindMany(...a) },
    department: { count: (...a: unknown[]) => departmentCount(...a) },
  },
}));
jest.mock("../../catalogService", () => ({
  buildCatalogWhereFragment: (...a: unknown[]) => buildCatalogWhereFragment(...a),
  buildCatalogWhereFragmentFromTitles: (...a: unknown[]) => buildCatalogWhereFragmentFromTitles(...a),
  getCatalogTreeWithCounts: () => getCatalogTreeWithCounts(),
}));

import { MAX_LISTING_LIMIT, fetchClientProductListing } from "../clientListing";
import { PRODUCT_CATEGORY_CATALOG } from "../../../constants/productCategories";

type Where = { AND: Array<Record<string, unknown>> };
const lastWhere = (): Where => productFindMany.mock.calls[0][0].where;
const hasClause = (clause: Record<string, unknown>) =>
  lastWhere().AND.some((c) => JSON.stringify(c) === JSON.stringify(clause));

beforeEach(() => {
  jest.clearAllMocks();
  productFindMany.mockResolvedValue([{ id: "p1", name: "Lamp" }]);
  productCount.mockResolvedValue(1);
  sellerFindMany.mockResolvedValue([]);
  departmentCount.mockResolvedValue(0);
  buildCatalogWhereFragmentFromTitles.mockResolvedValue(null);
});

describe("fetchClientProductListing", () => {
  it("always hides inactive and archived products", async () => {
    await fetchClientProductListing({});
    expect(hasClause({ isActive: true })).toBe(true);
    expect(hasClause({ isArchived: false })).toBe(true);
  });

  it("uses safe defaults for paging and sorting", async () => {
    const result = await fetchClientProductListing({});
    expect(productFindMany.mock.calls[0][0]).toMatchObject({ skip: 0, take: 10, orderBy: { createdAt: "desc" } });
    expect(result).toMatchObject({ currentPage: 1, totalPages: 1, totalProducts: 1 });
    expect(result.products[0]).toEqual({ id: "p1", name: "Lamp", sellerName: null });
  });

  it.each([
    [{ limit: "100000" }, { take: MAX_LISTING_LIMIT, skip: 0 }],
    [{ limit: "-5" }, { take: 1, skip: 0 }],
    [{ page: "-3", limit: "20" }, { take: 20, skip: 0 }],
    [{ page: "3", limit: "20" }, { take: 20, skip: 40 }],
  ])("clamps paging %o", async (query, expected) => {
    await fetchClientProductListing(query);
    expect(productFindMany.mock.calls[0][0]).toMatchObject(expected);
  });

  it("ignores unknown sort fields and directions", async () => {
    await fetchClientProductListing({ sortBy: "password", sortOrder: "sideways" });
    expect(productFindMany.mock.calls[0][0].orderBy).toEqual({ createdAt: "desc" });
  });

  it("accepts valid sort options", async () => {
    await fetchClientProductListing({ sortBy: "price", sortOrder: "ASC" });
    expect(productFindMany.mock.calls[0][0].orderBy).toEqual({ price: "asc" });
  });

  it.each(["trending", "bestsellers"])("sorts the %s collection by sales", async (collection) => {
    await fetchClientProductListing({ collection, sortBy: "price", sortOrder: "asc" });
    expect(productFindMany.mock.calls[0][0].orderBy).toEqual({ soldCount: "desc" });
  });

  it("filters the featured collection", async () => {
    await fetchClientProductListing({ collection: "featured" });
    expect(hasClause({ isFeatured: true })).toBe(true);
  });

  it("builds search, brand, size, color, condition and seller filters", async () => {
    await fetchClientProductListing({
      search: " lamp ",
      brands: "Halo,Nova",
      sizes: "M",
      colors: "Black",
      conditions: "new, used, broken",
      sellerIds: "s1, s2",
    });
    expect(hasClause({
      OR: [
        { name: { contains: "lamp", mode: "insensitive" } },
        { description: { contains: "lamp", mode: "insensitive" } },
        { brand: { contains: "lamp", mode: "insensitive" } },
      ],
    })).toBe(true);
    expect(hasClause({ brand: { in: ["Halo", "Nova"], mode: "insensitive" } })).toBe(true);
    expect(hasClause({ sizes: { hasSome: ["M"] } })).toBe(true);
    expect(hasClause({ colors: { hasSome: ["Black"] } })).toBe(true);
    expect(hasClause({ condition: { in: ["NEW", "USED"] } })).toBe(true);
    expect(hasClause({ sellerId: { in: ["s1", "s2"] } })).toBe(true);
  });

  it("applies price bounds", async () => {
    await fetchClientProductListing({ minPrice: "10", maxPrice: "50" });
    expect(hasClause({ price: { gte: 10, lte: 50 } })).toBe(true);
  });

  it("uses an impossible filter when catalog slugs match nothing", async () => {
    buildCatalogWhereFragment.mockResolvedValueOnce(null);
    await fetchClientProductListing({ subcategorySlug: "nope" });
    expect(hasClause({ id: { in: [] } })).toBe(true);
    expect(buildCatalogWhereFragmentFromTitles).not.toHaveBeenCalled();
  });

  it("falls back to legacy category tokens for a known main category", async () => {
    await fetchClientProductListing({ mainCategory: "beauty" });
    const beauty = PRODUCT_CATEGORY_CATALOG.find((c) => c.slug === "beauty")!;
    expect(hasClause({
      category: { in: [beauty.title, ...beauty.subcategories.map((s) => s.title)], mode: "insensitive" },
    })).toBe(true);
  });

  it("returns the DB catalog tree when departments exist", async () => {
    departmentCount.mockResolvedValueOnce(4);
    getCatalogTreeWithCounts.mockResolvedValueOnce([{ title: "Electronics" }]);
    const result = await fetchClientProductListing({});
    expect(result.availableCategories).toEqual([{ title: "Electronics" }]);
  });

  it("only lists active sellers", async () => {
    await fetchClientProductListing({});
    expect(sellerFindMany.mock.calls[0][0].where).toEqual({ isActive: true });
  });
});
