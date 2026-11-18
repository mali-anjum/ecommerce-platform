import prisma from "../lib/prisma";
import { PRODUCT_CATEGORY_CATALOG } from "../constants/productCategories";
import type { Prisma } from "@prisma/client";

/** Client API shape (matches legacy `PRODUCT_CATEGORY_CATALOG` + counts). */
export interface CatalogDepartmentDTO {
  title: string;
  slug: string;
  productCount: number;
  subcategories: Array<{
    title: string;
    slug: string;
    productCount: number;
  }>;
}

const CATALOG_CACHE_TTL_MS = 2 * 60 * 1000;

let cachedCatalogTree: CatalogDepartmentDTO[] | null = null;
let cachedCatalogTreeAt = 0;

// App-level: keeps DB catalog synced with the canonical category constants.
export async function upsertCatalogFromConstants(): Promise<{
  departmentsUpserted: number;
  subcategoriesUpserted: number;
}> {
  cachedCatalogTree = null;
  cachedCatalogTreeAt = 0;
  let departmentsUpserted = 0;
  let subcategoriesUpserted = 0;

  for (let i = 0; i < PRODUCT_CATEGORY_CATALOG.length; i++) {
    const row = PRODUCT_CATEGORY_CATALOG[i];
    const dept = await prisma.department.upsert({
      where: { slug: row.slug },
      create: {
        title: row.title,
        slug: row.slug,
        sortOrder: i,
      },
      update: {
        title: row.title,
        sortOrder: i,
        isActive: true,
      },
    });
    departmentsUpserted++;

    for (let j = 0; j < row.subcategories.length; j++) {
      const sub = row.subcategories[j];
      await prisma.subcategory.upsert({
        where: {
          departmentId_slug: {
            departmentId: dept.id,
            slug: sub.slug,
          },
        },
        create: {
          departmentId: dept.id,
          title: sub.title,
          slug: sub.slug,
          sortOrder: j,
        },
        update: {
          title: sub.title,
          sortOrder: j,
          isActive: true,
        },
      });
      subcategoriesUpserted++;
    }
  }

  return { departmentsUpserted, subcategoriesUpserted };
}

/** Attach `Product.subcategoryId` by matching `Product.category` to `Subcategory.title` (case-insensitive). */
// App-level: links legacy products to normalized subcategory records for consistent filtering.
export async function linkOrphanProductsToSubcategories(): Promise<number> {
  const subs = await prisma.subcategory.findMany({
    select: { id: true, title: true },
  });

  let updated = 0;
  for (const sub of subs) {
    const r = await prisma.product.updateMany({
      where: {
        subcategoryId: null,
        category: { equals: sub.title, mode: "insensitive" },
      },
      data: { subcategoryId: sub.id },
    });
    updated += r.count;
  }
  cachedCatalogTree = null;
  cachedCatalogTreeAt = 0;
  return updated;
}

async function countLegacyBySubcategoryTitle(
  title: string,
  excludeLinked: boolean
): Promise<number> {
  return prisma.product.count({
    where: {
      category: { equals: title, mode: "insensitive" },
      ...(excludeLinked ? { subcategoryId: null } : {}),
    },
  });
}

// App-level: returns the storefront category tree with live product counts (cached briefly).
export async function getCatalogTreeWithCounts(): Promise<CatalogDepartmentDTO[]> {
  const now = Date.now();
  if (cachedCatalogTree && now - cachedCatalogTreeAt < CATALOG_CACHE_TTL_MS) {
    return cachedCatalogTree;
  }

  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      subcategories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const result: CatalogDepartmentDTO[] = [];

  for (const dept of departments) {
    let deptTotal = 0;

    const subDtos = await Promise.all(
      dept.subcategories.map(async (sub) => {
        const byFk = await prisma.product.count({
          where: { subcategoryId: sub.id },
        });
        const legacyOnly = await countLegacyBySubcategoryTitle(sub.title, true);
        const subTotal = byFk + legacyOnly;
        deptTotal += subTotal;
        return {
          title: sub.title,
          slug: sub.slug,
          productCount: subTotal,
        };
      })
    );

    const legacyDeptName = await prisma.product.count({
      where: {
        subcategoryId: null,
        category: { equals: dept.title, mode: "insensitive" },
      },
    });
    deptTotal += legacyDeptName;

    result.push({
      title: dept.title,
      slug: dept.slug,
      productCount: deptTotal,
      subcategories: subDtos,
    });
  }

  cachedCatalogTree = result;
  cachedCatalogTreeAt = now;
  return result;
}

/**
 * Builds an additional `ProductWhereInput` fragment for catalog-based filters.
 * Combines FK (`subcategoryId`) and legacy string `category` matching.
 */
// App-level: builds Prisma filters from slug/id catalog params for product listing endpoints.
export async function buildCatalogWhereFragment(input: {
  departmentSlug?: string;
  subcategorySlug?: string;
  subcategoryId?: string;
}): Promise<Prisma.ProductWhereInput | null> {
  const deptSlug = input.departmentSlug?.trim();
  const subSlug = input.subcategorySlug?.trim();
  const subId = input.subcategoryId?.trim();

  if (subId) {
    const sub = await prisma.subcategory.findUnique({
      where: { id: subId },
      select: { title: true },
    });
    if (!sub) return { id: { in: [] } };

    return {
      OR: [
        { subcategoryId: subId },
        {
          AND: [{ subcategoryId: null }, { category: { equals: sub.title, mode: "insensitive" } }],
        },
      ],
    };
  }

  /** Single subcategory slug (slugs are unique across seeded catalog). */
  if (subSlug && !deptSlug) {
    const sub = await prisma.subcategory.findFirst({
      where: { slug: subSlug },
      select: { id: true, title: true },
    });
    if (!sub) return { id: { in: [] } };

    return {
      OR: [
        { subcategoryId: sub.id },
        {
          AND: [{ subcategoryId: null }, { category: { equals: sub.title, mode: "insensitive" } }],
        },
      ],
    };
  }

  if (deptSlug && subSlug) {
    const sub = await prisma.subcategory.findFirst({
      where: { slug: subSlug, department: { slug: deptSlug, isActive: true } },
      select: { id: true, title: true },
    });
    if (!sub) return { id: { in: [] } };

    return {
      OR: [
        { subcategoryId: sub.id },
        {
          AND: [{ subcategoryId: null }, { category: { equals: sub.title, mode: "insensitive" } }],
        },
      ],
    };
  }

  if (deptSlug && !subSlug) {
    const department = await prisma.department.findUnique({
      where: { slug: deptSlug },
      include: {
        subcategories: { where: { isActive: true }, select: { id: true, title: true } },
      },
    });
    if (!department) {
      return { id: { in: [] } };
    }

    const subIds = department.subcategories.map((s) => s.id);
    const subTitles = department.subcategories.map((s) => s.title);
    const tokens = [department.title, ...subTitles];

    return {
      OR: [
        ...(subIds.length ? [{ subcategoryId: { in: subIds } } as const] : []),
        {
          subcategoryId: null,
          category: { in: tokens, mode: "insensitive" },
        },
      ],
    };
  }

  return null;
}

/**
 * Title-based catalog matching used by current client query params:
 * `/products?mainCategory=Electronics&subcategory=Laptops`
 *
 * Combines FK (`subcategoryId`) and legacy `Product.category` text matching.
 */
// App-level: supports current title-based query params while still using normalized catalog relations.
export async function buildCatalogWhereFragmentFromTitles(input: {
  mainCategory?: string;
  subcategory?: string;
}): Promise<Prisma.ProductWhereInput | null> {
  const main = input.mainCategory?.trim();
  const sub = input.subcategory?.trim();

  if (main && sub) {
    const subRow = await prisma.subcategory.findFirst({
      where: {
        title: { equals: sub, mode: "insensitive" },
        department: {
          title: { equals: main, mode: "insensitive" },
          isActive: true,
        },
      },
      select: { id: true, title: true },
    });

    if (!subRow) return null;

    return {
      OR: [
        { subcategoryId: subRow.id },
        {
          AND: [
            { subcategoryId: null },
            { category: { equals: subRow.title, mode: "insensitive" } },
          ],
        },
      ],
    };
  }

  if (main && !sub) {
    const dept = await prisma.department.findFirst({
      where: {
        title: { equals: main, mode: "insensitive" },
        isActive: true,
      },
      include: {
        subcategories: {
          where: { isActive: true },
          select: { id: true, title: true },
        },
      },
    });

    if (!dept) return null;

    const subIds = dept.subcategories.map((s) => s.id);
    const subTitles = dept.subcategories.map((s) => s.title);
    const legacyTokens = [dept.title, ...subTitles];

    return {
      OR: [
        ...(subIds.length ? [{ subcategoryId: { in: subIds } } as const] : []),
        {
          subcategoryId: null,
          category: { in: legacyTokens, mode: "insensitive" },
        },
      ],
    };
  }

  if (!main && sub) {
    const subRow = await prisma.subcategory.findFirst({
      where: { title: { equals: sub, mode: "insensitive" } },
      select: { id: true, title: true },
    });
    if (!subRow) return null;

    return {
      OR: [
        { subcategoryId: subRow.id },
        {
          AND: [
            { subcategoryId: null },
            { category: { equals: subRow.title, mode: "insensitive" } },
          ],
        },
      ],
    };
  }

  return null;
}
