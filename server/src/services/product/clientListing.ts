import type { Request } from "express";
import { Prisma, ProductCondition } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { PRODUCT_CATEGORY_CATALOG } from "../../constants/productCategories";
import {
  buildCatalogWhereFragment,
  buildCatalogWhereFragmentFromTitles,
  getCatalogTreeWithCounts,
} from "../catalogService";

/**
 * Public storefront listing: filters, sort, catalog tree, and active sellers.
 */
export async function fetchClientProductListing(query: Request["query"]) {
  const page = parseInt(String(query.page ?? ""), 10) || 1;
  const limit = parseInt(String(query.limit ?? ""), 10) || 10;

  const categories = String(query.categories ?? "")
    .split(",")
    .filter(Boolean);
  const colors = String(query.colors ?? "")
    .split(",")
    .filter(Boolean);
  const sizes = String(query.sizes ?? "")
    .split(",")
    .filter(Boolean);
  const brands = String(query.brands ?? "")
    .split(",")
    .filter(Boolean);
  const search = String(query.search ?? "").trim();
  const mainCategory = String(query.mainCategory ?? "").trim();
  const subcategory = String(query.subcategory ?? "").trim();
  const departmentSlug = String(query.departmentSlug ?? "").trim();
  const subcategorySlug = String(query.subcategorySlug ?? "").trim();
  const subcategoryIdParam = String(query.subcategoryId ?? "").trim();
  const collection = String(query.collection ?? "all").toLowerCase();
  const conditionsQuery = String(query.conditions ?? "")
    .split(",")
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);
  const sellerIds = String(query.sellerIds ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const onDeal = String(query.onDeal ?? "").toLowerCase() === "true";
  const minDiscountRaw = Number(query.minDiscount);
  const minDiscount =
    Number.isFinite(minDiscountRaw) && minDiscountRaw > 0 ? minDiscountRaw : 0;

  const minPrice = parseFloat(String(query.minPrice ?? "")) || 0;
  const maxPrice =
    parseFloat(String(query.maxPrice ?? "")) || Number.MAX_SAFE_INTEGER;

  let sortBy = String(query.sortBy ?? "createdAt");
  let sortOrder = (String(query.sortOrder ?? "desc") || "desc") as
    | "asc"
    | "desc";

  const skip = (page - 1) * limit;

  const useCatalogSlugs =
    departmentSlug.length > 0 ||
    subcategorySlug.length > 0 ||
    subcategoryIdParam.length > 0;

  const slugCatalogWhere = useCatalogSlugs
    ? await buildCatalogWhereFragment({
        departmentSlug: departmentSlug || undefined,
        subcategorySlug: subcategorySlug || undefined,
        subcategoryId: subcategoryIdParam || undefined,
      })
    : null;

  const catalogFilter: Prisma.ProductWhereInput | null = useCatalogSlugs
    ? slugCatalogWhere ?? { id: { in: [] } }
    : null;

  const titleCatalogWhere =
    !useCatalogSlugs && (mainCategory.length > 0 || subcategory.length > 0)
      ? await buildCatalogWhereFragmentFromTitles({
          mainCategory: mainCategory || undefined,
          subcategory: subcategory || undefined,
        })
      : null;

  const selectedMainCategory = useCatalogSlugs
    ? undefined
    : PRODUCT_CATEGORY_CATALOG.find(
        (category) => category.title.toLowerCase() === mainCategory.toLowerCase()
      );
  const selectedMainCategoryTokens = selectedMainCategory
    ? [
        selectedMainCategory.title,
        ...selectedMainCategory.subcategories.map((item) => item.title),
      ]
    : [];

  const searchFilter: Prisma.ProductWhereInput =
    search.length > 0
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

  let collectionWhere: Prisma.ProductWhereInput = {};
  if (collection === "featured") {
    collectionWhere = { isFeatured: true };
  }
  if (collection === "trending" || collection === "bestsellers") {
    sortBy = "soldCount";
    sortOrder = "desc";
  }
  if (collection === "new") {
    sortBy = "createdAt";
    sortOrder = "desc";
  }

  const validSortFields = new Set([
    "createdAt",
    "price",
    "soldCount",
    "rating",
    "name",
  ]);
  const safeSortBy = validSortFields.has(sortBy) ? sortBy : "createdAt";
  const conditions = conditionsQuery.filter(
    (entry): entry is ProductCondition =>
      entry === "NEW" || entry === "REFURBISHED" || entry === "USED"
  );
  const now = new Date();

  const where: Prisma.ProductWhereInput = {
    AND: [
      { isActive: true },
      { isArchived: false },
      collectionWhere,
      searchFilter,
      catalogFilter !== null
        ? catalogFilter
        : titleCatalogWhere !== null
          ? titleCatalogWhere
          : selectedMainCategoryTokens.length > 0
            ? {
                category: {
                  in: selectedMainCategoryTokens,
                  mode: "insensitive",
                },
              }
            : {},
      catalogFilter !== null || titleCatalogWhere !== null
        ? {}
        : subcategory
          ? {
              category: {
                equals: subcategory,
                mode: "insensitive",
              },
            }
          : {},
      categories.length > 0
        ? {
            category: {
              in: categories,
              mode: "insensitive",
            },
          }
        : {},
      brands.length > 0
        ? {
            brand: {
              in: brands,
              mode: "insensitive",
            },
          }
        : {},
      conditions.length > 0 ? { condition: { in: conditions } } : {},
      sellerIds.length > 0
        ? {
            sellerId: {
              in: sellerIds,
            },
          }
        : {},
      minDiscount > 0
        ? {
            discountPercent: {
              gte: minDiscount,
            },
          }
        : {},
      onDeal
        ? {
            discountPercent: {
              gt: 0,
            },
            AND: [
              { OR: [{ dealStartsAt: null }, { dealStartsAt: { lte: now } }] },
              { OR: [{ dealEndsAt: null }, { dealEndsAt: { gte: now } }] },
            ],
          }
        : {},
      sizes.length > 0
        ? {
            sizes: {
              hasSome: sizes,
            },
          }
        : {},
      colors.length > 0
        ? {
            colors: {
              hasSome: colors,
            },
          }
        : {},
      {
        price: { gte: minPrice, lte: maxPrice },
      },
    ],
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),
    prisma.product.count({ where }),
  ]);

  const sellerDelegate = (prisma as unknown as {
    seller?: {
      findMany: (args: unknown) => Promise<Array<{ id: string; name: string }>>;
    };
  }).seller;

  const availableSellers = sellerDelegate
    ? await sellerDelegate.findMany({
        where: { isActive: true },
        orderBy: [{ isPremium: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
        },
        take: 50,
      })
    : [];

  const productsForResponse = products.map((product) => ({
    ...product,
    sellerName: null,
  }));

  const deptRows = await prisma.department.count();
  const availableCategories =
    deptRows > 0
      ? await getCatalogTreeWithCounts()
      : PRODUCT_CATEGORY_CATALOG;

  return {
    products: productsForResponse,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalProducts: total,
    availableCategories,
    availableSellers,
  };
}
