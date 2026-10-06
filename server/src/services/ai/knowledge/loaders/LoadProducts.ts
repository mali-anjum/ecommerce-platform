import { prisma } from "../../../../lib/prisma";
import { searchAssistantProductsFromIndex } from "../../productIndex";
import type { AssistantProductSnippet } from "../../types";
import { extractSearchTerms, rankByScore } from "../relevance";
import {
  MAX_CONTEXT_PRODUCTS,
  scoreProductRelevance,
  toProductSnippet,
} from "./ProductSnippets";

const productSelect = {
  id: true,
  name: true,
  brand: true,
  description: true,
  price: true,
  stock: true,
  category: true,
  condition: true,
  discountPercent: true,
} as const;

// Fetch a wider candidate pool than we keep, so relevance ranking (not just sales) decides.
const CANDIDATE_POOL = MAX_CONTEXT_PRODUCTS * 3;

export type LoadProductsOptions = {
  /** Top up with featured products when few match. Off for help/FAQ questions (pure noise there). */
  padWithFeatured?: boolean;
};

export async function loadRelevantProducts(
  message: string,
  productId?: string,
  options: LoadProductsOptions = {},
): Promise<AssistantProductSnippet[]> {
  const padWithFeatured = options.padWithFeatured ?? true;
  const indexed = searchAssistantProductsFromIndex(message, productId, { padWithFeatured });
  if (indexed) {
    return indexed;
  }

  const snippets: AssistantProductSnippet[] = [];
  const seen = new Set<string>();

  if (productId) {
    const focused = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
        isArchived: false,
      },
      select: productSelect,
    });
    if (focused) {
      snippets.push(toProductSnippet(focused));
      seen.add(focused.id);
    }
  }

  const terms = extractSearchTerms(message);
  if (terms.length > 0) {
    const searchWhere = {
      isActive: true,
      isArchived: false,
      OR: terms.flatMap((term) => [
        { name: { contains: term, mode: "insensitive" as const } },
        { brand: { contains: term, mode: "insensitive" as const } },
        { description: { contains: term, mode: "insensitive" as const } },
        { category: { contains: term, mode: "insensitive" as const } },
      ]),
    };

    const candidates = await prisma.product.findMany({
      where: searchWhere,
      take: CANDIDATE_POOL,
      orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
      select: productSelect,
    });

    const ranked = rankByScore(
      candidates.filter((product) => !seen.has(product.id)),
      (product) => scoreProductRelevance(product, terms),
      MAX_CONTEXT_PRODUCTS - snippets.length,
    );
    for (const product of ranked) {
      snippets.push(toProductSnippet(product));
      seen.add(product.id);
    }
  }

  if (padWithFeatured && snippets.length < 3) {
    const featured = await prisma.product.findMany({
      where: { isActive: true, isArchived: false },
      take: MAX_CONTEXT_PRODUCTS,
      orderBy: [{ isFeatured: "desc" }, { soldCount: "desc" }],
      select: productSelect,
    });

    for (const product of featured) {
      if (seen.has(product.id)) continue;
      snippets.push(toProductSnippet(product));
      seen.add(product.id);
      if (snippets.length >= MAX_CONTEXT_PRODUCTS) break;
    }
  }

  return snippets;
}
