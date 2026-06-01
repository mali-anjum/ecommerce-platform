import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { queryRecommendationsFromIndex } from "./productIndex";
import type {
  ProductRecommendationResult,
  RecommendedProduct,
  RecommendationFilters,
} from "./types";
import { parseRecommendationFilters } from "./recommendationParser";

const MAX_RECOMMENDATIONS = 6;

const productSelect = {
  id: true,
  name: true,
  brand: true,
  price: true,
  discountPercent: true,
  images: true,
  category: true,
  stock: true,
  soldCount: true,
  rating: true,
} as const;

function effectivePrice(price: number, discountPercent: number | null): number {
  if (discountPercent != null && discountPercent > 0) {
    return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
  }
  return price;
}

function toRecommendedProduct(
  product: Prisma.ProductGetPayload<{ select: typeof productSelect }>,
): RecommendedProduct {
  const discountPercent = product.discountPercent ?? null;
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    discountPercent,
    effectivePrice: effectivePrice(product.price, discountPercent),
    images: product.images,
    category: product.category,
    stock: product.stock,
    rating: product.rating,
  };
}

function buildOrderBy(
  sortBy: RecommendationFilters["sortBy"],
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sortBy) {
    case "price_asc":
      return [{ price: "asc" }, { soldCount: "desc" }];
    case "price_desc":
      return [{ price: "desc" }, { soldCount: "desc" }];
    case "discount":
      return [
        { discountPercent: "desc" },
        { soldCount: "desc" },
        { price: "asc" },
      ];
    case "popular":
    default:
      return [{ soldCount: "desc" }, { rating: "desc" }, { createdAt: "desc" }];
  }
}

function buildWhereClause(
  query: string,
  filters: RecommendationFilters,
): Prisma.ProductWhereInput {
  const priceFilter: Prisma.FloatFilter = {};
  if (filters.maxPrice != null) {
    priceFilter.lte = filters.maxPrice;
  }
  if (filters.minPrice != null) {
    priceFilter.gte = filters.minPrice;
  }

  const categoryOr: Prisma.ProductWhereInput[] = [];
  if (filters.categories && filters.categories.length > 0) {
    for (const category of filters.categories) {
      categoryOr.push({
        category: { contains: category, mode: "insensitive" },
      });
    }
  }

  const termOr: Prisma.ProductWhereInput[] = [];
  const terms = [
    ...(filters.searchTerms ?? []),
    ...query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3),
  ].slice(0, 10);

  for (const term of new Set(terms)) {
    termOr.push({ name: { contains: term, mode: "insensitive" } });
    termOr.push({ brand: { contains: term, mode: "insensitive" } });
    termOr.push({ description: { contains: term, mode: "insensitive" } });
    termOr.push({ category: { contains: term, mode: "insensitive" } });
  }

  const intentOr =
    categoryOr.length > 0 || termOr.length > 0
      ? [...categoryOr, ...termOr]
      : undefined;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    isArchived: false,
    stock: { gt: 0 },
  };

  if (Object.keys(priceFilter).length > 0) {
    // Use list price as a coarse DB filter; effective price is applied after mapping.
    if (filters.maxPrice != null) {
      priceFilter.lte = Math.ceil(filters.maxPrice * 1.5);
    }
    where.price = priceFilter;
  }

  if (filters.preferDiscount) {
    where.discountPercent = { gt: 0 };
  }

  if (intentOr && intentOr.length > 0) {
    where.OR = intentOr;
  }

  return where;
}

export async function getProductRecommendations(
  query: string,
  filters?: RecommendationFilters,
): Promise<ProductRecommendationResult> {
  const resolvedFilters = filters ?? parseRecommendationFilters(query);

  const indexed = queryRecommendationsFromIndex(query, resolvedFilters);
  if (indexed) {
    return {
      intent: "product_recommendation",
      products: indexed,
      filtersApplied: resolvedFilters,
    };
  }

  const where = buildWhereClause(query, resolvedFilters);
  const orderBy = buildOrderBy(resolvedFilters.sortBy ?? "popular");

  let products = await prisma.product.findMany({
    where,
    orderBy,
    take: MAX_RECOMMENDATIONS,
    select: productSelect,
  });

  if (products.length === 0 && (where.OR || where.discountPercent)) {
    const relaxedWhere: Prisma.ProductWhereInput = {
      isActive: true,
      isArchived: false,
      stock: { gt: 0 },
    };
    if (where.price) {
      relaxedWhere.price = where.price;
    }
    if (where.OR) {
      relaxedWhere.OR = where.OR;
    }

    products = await prisma.product.findMany({
      where: relaxedWhere,
      orderBy,
      take: MAX_RECOMMENDATIONS,
      select: productSelect,
    });
  }

  if (products.length === 0 && resolvedFilters.maxPrice != null) {
    products = await prisma.product.findMany({
      where: {
        isActive: true,
        isArchived: false,
        stock: { gt: 0 },
        price: { lte: resolvedFilters.maxPrice },
      },
      orderBy: buildOrderBy("price_asc"),
      take: MAX_RECOMMENDATIONS,
      select: productSelect,
    });
  }

  const recommended = products
    .map(toRecommendedProduct)
    .filter((product) => {
      if (
        resolvedFilters.maxPrice != null &&
        product.effectivePrice > resolvedFilters.maxPrice
      ) {
        return false;
      }
      if (
        resolvedFilters.minPrice != null &&
        product.effectivePrice < resolvedFilters.minPrice
      ) {
        return false;
      }
      return true;
    })
    .slice(0, MAX_RECOMMENDATIONS);

  if (resolvedFilters.sortBy === "price_asc" || resolvedFilters.preferDiscount) {
    recommended.sort((a, b) => a.effectivePrice - b.effectivePrice);
  }

  return {
    intent: "product_recommendation",
    products: recommended,
    filtersApplied: resolvedFilters,
  };
}
