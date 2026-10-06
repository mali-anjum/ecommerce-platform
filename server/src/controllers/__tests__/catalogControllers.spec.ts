import type { NextFunction, Response } from "express";

const deptCreate = jest.fn();
const deptFindUnique = jest.fn();
const deptUpdate = jest.fn();
const deptDelete = jest.fn();
const deptFindMany = jest.fn();
const subCreate = jest.fn();
const subFindUnique = jest.fn();
const subUpdate = jest.fn();
const subDelete = jest.fn();
const invalidateCatalogTreeCache = jest.fn();
const upsertCatalogFromConstants = jest.fn();
const linkOrphanProductsToSubcategories = jest.fn();
const getCatalogTreeWithCounts = jest.fn();

jest.mock("../../lib/prisma", () => ({
  __esModule: true,
  default: {
    department: {
      create: (...a: unknown[]) => deptCreate(...a),
      findUnique: (...a: unknown[]) => deptFindUnique(...a),
      update: (...a: unknown[]) => deptUpdate(...a),
      delete: (...a: unknown[]) => deptDelete(...a),
      findMany: (...a: unknown[]) => deptFindMany(...a),
    },
    subcategory: {
      create: (...a: unknown[]) => subCreate(...a),
      findUnique: (...a: unknown[]) => subFindUnique(...a),
      update: (...a: unknown[]) => subUpdate(...a),
      delete: (...a: unknown[]) => subDelete(...a),
    },
  },
}));
jest.mock("../../services/catalogService", () => ({
  invalidateCatalogTreeCache: () => invalidateCatalogTreeCache(),
  upsertCatalogFromConstants: () => upsertCatalogFromConstants(),
  linkOrphanProductsToSubcategories: () => linkOrphanProductsToSubcategories(),
  getCatalogTreeWithCounts: () => getCatalogTreeWithCounts(),
}));

import {
  adminCreateDepartment,
  adminCreateSubcategory,
  adminDeleteDepartment,
  adminDeleteSubcategory,
  adminUpdateDepartment,
  adminUpdateSubcategory,
  parseSlug,
  seedCatalogEndpoint,
} from "../catalogAdminController";
import { getCatalogTree, listDepartmentStructure } from "../catalogPublicController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
async function run(handler: typeof adminCreateDepartment, req: Record<string, unknown>) {
  const res = buildRes();
  const next = jest.fn() as NextFunction & jest.Mock;
  handler({ params: {}, body: {}, ...req } as never, res, next);
  await new Promise((r) => setImmediate(r));
  return { res, next };
}

beforeEach(() => jest.clearAllMocks());

describe("parseSlug", () => {
  it("normalises valid slugs", () => {
    expect(parseSlug(" Home-Living ")).toBe("home-living");
  });

  it.each(["", "   ", "home living", "home--living", "-home", "home/../x", 5])("rejects %p", (value) => {
    expect(() => parseSlug(value)).toThrow();
  });
});

describe("departments", () => {
  it("creates a department with normalised fields and refreshes the cache", async () => {
    deptCreate.mockResolvedValueOnce({ id: "d1" });
    const { res } = await run(adminCreateDepartment, { body: { title: " Toys ", slug: "Toys", description: "  ", sortOrder: "3" } });
    expect(deptCreate).toHaveBeenCalledWith({ data: { title: "Toys", slug: "toys", description: null, sortOrder: 3 } });
    expect(invalidateCatalogTreeCache).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it.each([
    [{ slug: "toys" }, "title is required"],
    [{ title: "Toys" }, "slug is required"],
    [{ title: "Toys", slug: "to ys" }, "slug must be lowercase letters, numbers, and single hyphens only"],
  ])("validates create input %o", async (body, message) => {
    const { next } = await run(adminCreateDepartment, { body });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message });
    expect(deptCreate).not.toHaveBeenCalled();
  });

  it("returns 404 when updating a missing department", async () => {
    deptFindUnique.mockResolvedValueOnce(null);
    const { next } = await run(adminUpdateDepartment, { params: { id: "d9" }, body: { title: "X" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 404 });
  });

  it("only updates provided fields and rejects blank titles", async () => {
    deptFindUnique.mockResolvedValue({ id: "d1" });
    deptUpdate.mockResolvedValueOnce({ id: "d1" });
    await run(adminUpdateDepartment, { params: { id: "d1" }, body: { isActive: false } });
    expect(deptUpdate).toHaveBeenCalledWith({ where: { id: "d1" }, data: { isActive: false } });

    const { next } = await run(adminUpdateDepartment, { params: { id: "d1" }, body: { title: "   " } });
    expect(next.mock.calls[0][0]).toMatchObject({ message: "title is required" });
  });

  it("deletes a department", async () => {
    deptDelete.mockResolvedValueOnce({});
    const { res } = await run(adminDeleteDepartment, { params: { id: "d1" } });
    expect(deptDelete).toHaveBeenCalledWith({ where: { id: "d1" } });
    expect(invalidateCatalogTreeCache).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("subcategories", () => {
  it("requires an existing department", async () => {
    deptFindUnique.mockResolvedValueOnce(null);
    const { next } = await run(adminCreateSubcategory, { body: { departmentId: "d9", title: "Drones", slug: "drones" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 404 });
    expect(subCreate).not.toHaveBeenCalled();
  });

  it("requires a departmentId", async () => {
    const { next } = await run(adminCreateSubcategory, { body: { title: "Drones", slug: "drones" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: "departmentId is required" });
  });

  it("creates a subcategory", async () => {
    deptFindUnique.mockResolvedValueOnce({ id: "d1" });
    subCreate.mockResolvedValueOnce({ id: "s1" });
    const { res } = await run(adminCreateSubcategory, { body: { departmentId: "d1", title: "Drones", slug: "Drones", sortOrder: 2 } });
    expect(subCreate).toHaveBeenCalledWith({ data: { departmentId: "d1", title: "Drones", slug: "drones", sortOrder: 2 } });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("updates and deletes subcategories", async () => {
    subFindUnique.mockResolvedValueOnce({ id: "s1" });
    subUpdate.mockResolvedValueOnce({ id: "s1" });
    await run(adminUpdateSubcategory, { params: { id: "s1" }, body: { slug: "quad-copters", sortOrder: "x" } });
    expect(subUpdate).toHaveBeenCalledWith({ where: { id: "s1" }, data: { slug: "quad-copters", sortOrder: 0 } });

    subDelete.mockResolvedValueOnce({});
    const { res } = await run(adminDeleteSubcategory, { params: { id: "s1" } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(invalidateCatalogTreeCache).toHaveBeenCalledTimes(2);
  });

  it("returns 404 when updating a missing subcategory", async () => {
    subFindUnique.mockResolvedValueOnce(null);
    const { next } = await run(adminUpdateSubcategory, { params: { id: "s9" }, body: {} });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 404 });
  });
});

describe("seedCatalogEndpoint", () => {
  it("seeds and links products", async () => {
    upsertCatalogFromConstants.mockResolvedValueOnce({ departmentsUpserted: 4, subcategoriesUpserted: 16 });
    linkOrphanProductsToSubcategories.mockResolvedValueOnce(3);
    const { res } = await run(seedCatalogEndpoint, {});
    expect(res.json.mock.calls[0][0].data).toEqual({ departmentsUpserted: 4, subcategoriesUpserted: 16, productsLinked: 3 });
  });
});

describe("public catalog", () => {
  it("returns the counted tree", async () => {
    getCatalogTreeWithCounts.mockResolvedValueOnce([{ title: "Electronics" }]);
    const { res } = await run(getCatalogTree, {});
    expect(res.json.mock.calls[0][0].data).toEqual([{ title: "Electronics" }]);
  });

  it("lists only active departments and subcategories", async () => {
    deptFindMany.mockResolvedValueOnce([]);
    await run(listDepartmentStructure, {});
    const args = deptFindMany.mock.calls[0][0];
    expect(args.where).toEqual({ isActive: true });
    expect(args.select.subcategories.where).toEqual({ isActive: true });
  });
});
