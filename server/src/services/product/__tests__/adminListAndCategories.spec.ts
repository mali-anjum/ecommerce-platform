const productFindMany = jest.fn((args: unknown) => ({ op: "findMany", args }));
const productCount = jest.fn((args: unknown) => ({ op: "count", args }));
const productGroupBy = jest.fn();
const departmentCount = jest.fn();
const transaction = jest.fn();
const getCatalogTreeWithCounts = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    product: {
      findMany: (a: unknown) => productFindMany(a),
      count: (a: unknown) => productCount(a),
      groupBy: (...a: unknown[]) => productGroupBy(...a),
    },
    department: { count: () => departmentCount() },
    $transaction: (...a: unknown[]) => transaction(...a),
  },
}));
jest.mock("../../catalogService", () => ({
  getCatalogTreeWithCounts: () => getCatalogTreeWithCounts(),
}));

import { fetchProductsForAdminPaginated, parseAdminProductPagination } from "../adminList";
import { getProductCategoriesPayload } from "../categories";

beforeEach(() => jest.clearAllMocks());

describe("parseAdminProductPagination", () => {
  it.each([
    [undefined, undefined, { page: 1, limit: 50, skip: 0 }],
    ["2", "10", { page: 2, limit: 10, skip: 10 }],
    ["0", "999", { page: 1, limit: 200, skip: 0 }],
    ["abc", "-1", { page: 1, limit: 1, skip: 0 }],
  ])("parses page=%p limit=%p", (page, limit, expected) => {
    expect(parseAdminProductPagination(page, limit)).toEqual(expected);
  });
});

describe("fetchProductsForAdminPaginated", () => {
  it("scopes sellers to their own products and builds paging meta", async () => {
    transaction.mockResolvedValueOnce([[{ id: "p1" }], 25]);
    const result = await fetchProductsForAdminPaginated("seller-1", 2, 10);
    const [findOp, countOp] = transaction.mock.calls[0][0];
    expect(findOp.args).toMatchObject({ where: { sellerId: "seller-1" }, skip: 10, take: 10 });
    expect(countOp.args).toEqual({ where: { sellerId: "seller-1" } });
    expect(result.meta).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3, hasNext: true, hasPrev: true, skip: 10 });
  });

  it("lists every product for super admins", async () => {
    transaction.mockResolvedValueOnce([[], 0]);
    const result = await fetchProductsForAdminPaginated(null, 1, 50);
    expect(transaction.mock.calls[0][0][0].args.where).toEqual({});
    expect(result.meta).toMatchObject({ totalPages: 0, hasNext: false, hasPrev: false });
  });
});

describe("getProductCategoriesPayload", () => {
  it("uses the DB tree when departments exist", async () => {
    departmentCount.mockResolvedValueOnce(2);
    getCatalogTreeWithCounts.mockResolvedValueOnce(["tree"]);
    await expect(getProductCategoriesPayload()).resolves.toEqual(["tree"]);
    expect(productGroupBy).not.toHaveBeenCalled();
  });

  it("falls back to constants with counts of visible products", async () => {
    departmentCount.mockResolvedValueOnce(0);
    productGroupBy.mockResolvedValueOnce([
      { category: "laptops", _count: { _all: 3 } },
      { category: "Electronics", _count: { _all: 2 } },
      { category: "Unknown", _count: { _all: 9 } },
    ]);
    const payload = await getProductCategoriesPayload();
    expect(productGroupBy.mock.calls[0][0].where).toEqual({ isActive: true, isArchived: false });
    const electronics = payload.find((c: { title: string }) => c.title === "Electronics")!;
    expect(electronics.productCount).toBe(5);
    expect(electronics.subcategories.find((s: { title: string }) => s.title === "Laptops")!.productCount).toBe(3);
  });
});
