import { prisma } from "../../../lib/prisma";
import { searchAssistantProductsFromIndex } from "../productIndex";
import type { AssistantProductSnippet } from "../types";
import {
  extractSearchTerms,
  MAX_CONTEXT_PRODUCTS,
  toProductSnippet,
} from "./productSnippets";

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

export async function loadRelevantProducts(
  message: string,
  productId?: string,
): Promise<AssistantProductSnippet[]> {
  const indexed = searchAssistantProductsFromIndex(message, productId);
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

    const matched = await prisma.product.findMany({
      where: searchWhere,
      take: MAX_CONTEXT_PRODUCTS,
      orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
      select: productSelect,
    });

    for (const product of matched) {
      if (seen.has(product.id)) continue;
      snippets.push(toProductSnippet(product));
      seen.add(product.id);
      if (snippets.length >= MAX_CONTEXT_PRODUCTS) break;
    }
  }

  if (snippets.length < 3) {
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
