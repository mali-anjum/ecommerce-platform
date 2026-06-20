import type { AssistantProductSnippet } from "../types";
import type { RecommendationFilters, RecommendedProduct } from "../types";
import { isSellableIndexEntry } from "./productIndexMapper";
import {
  getProductIndexEntry,
  isProductIndexReady,
  listSellableProductIndexEntries,
} from "./productIndexSync";
import type { AiProductIndexEntry } from "./types";

const MAX_PRODUCTS = 8;
const MAX_RECOMMENDATIONS = 6;

function toAssistantSnippet(entry: AiProductIndexEntry): AssistantProductSnippet {
  return {
    id: entry.id,
    name: entry.name,
    brand: entry.brand,
    description: entry.description.slice(0, 500),
    price: entry.price,
    stock: entry.stock,
    category: entry.category,
    condition: entry.condition,
    discountPercent: entry.discountPercent,
  };
}

function toRecommendedProduct(entry: AiProductIndexEntry): RecommendedProduct {
  return {
    id: entry.id,
    name: entry.name,
    brand: entry.brand,
    price: entry.price,
    discountPercent: entry.discountPercent,
    effectivePrice: entry.effectivePrice,
    images: entry.images,
    category: entry.category,
    stock: entry.stock,
    rating: entry.rating,
  };
}

function extractSearchTerms(message: string): string[] {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "is",
    "are",
    "what",
    "how",
    "do",
    "you",
    "we",
    "i",
    "my",
    "this",
    "that",
    "about",
    "for",
    "and",
    "or",
    "can",
    "please",
    "tell",
    "me",
    "ship",
    "shipping",
    "return",
    "policy",
    "product",
    "explain",
  ]);

  return message
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 6);
}

function matchesTerms(entry: AiProductIndexEntry, terms: string[]): boolean {
  if (terms.length === 0) return false;
  return terms.some((term) => entry.searchText.includes(term));
}

function matchesCategories(
  entry: AiProductIndexEntry,
  categories: string[] | undefined,
): boolean {
  if (!categories || categories.length === 0) return true;
  const category = entry.category.toLowerCase();
  return categories.some((value) => category.includes(value.toLowerCase()));
}

function sortEntries(
  entries: AiProductIndexEntry[],
  sortBy: RecommendationFilters["sortBy"],
): AiProductIndexEntry[] {
  const sorted = [...entries];
  switch (sortBy) {
    case "price_asc":
      sorted.sort((a, b) => a.effectivePrice - b.effectivePrice);
      break;
    case "price_desc":
      sorted.sort((a, b) => b.effectivePrice - a.effectivePrice);
      break;
    case "discount":
      sorted.sort((a, b) => {
        const discountDelta =
          (b.discountPercent ?? 0) - (a.discountPercent ?? 0);
        if (discountDelta !== 0) return discountDelta;
        return a.effectivePrice - b.effectivePrice;
      });
      break;
    case "popular":
    default:
      sorted.sort((a, b) => {
        const soldDelta = b.soldCount - a.soldCount;
        if (soldDelta !== 0) return soldDelta;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
      break;
  }
  return sorted;
}

export function searchAssistantProductsFromIndex(
  message: string,
  productId?: string,
): AssistantProductSnippet[] | null {
  if (!isProductIndexReady()) {
    return null;
  }

  const snippets: AssistantProductSnippet[] = [];
  const seen = new Set<string>();

  if (productId) {
    const focused = getProductIndexEntry(productId);
    if (focused && isSellableIndexEntry(focused)) {
      snippets.push(toAssistantSnippet(focused));
      seen.add(focused.id);
    }
  }

  const terms = extractSearchTerms(message);
  if (terms.length > 0) {
    for (const entry of listSellableProductIndexEntries()) {
      if (seen.has(entry.id)) continue;
      if (!matchesTerms(entry, terms)) continue;
      snippets.push(toAssistantSnippet(entry));
      seen.add(entry.id);
      if (snippets.length >= MAX_PRODUCTS) break;
    }
  }

  if (snippets.length < 3) {
    const featured = listSellableProductIndexEntries()
      .sort((a, b) => {
        const featuredDelta = Number(b.isFeatured) - Number(a.isFeatured);
        if (featuredDelta !== 0) return featuredDelta;
        return b.soldCount - a.soldCount;
      })
      .slice(0, MAX_PRODUCTS);

    for (const entry of featured) {
      if (seen.has(entry.id)) continue;
      snippets.push(toAssistantSnippet(entry));
      seen.add(entry.id);
      if (snippets.length >= MAX_PRODUCTS) break;
    }
  }

  return snippets;
}

export function queryRecommendationsFromIndex(
  query: string,
  filters: RecommendationFilters,
  limit = MAX_RECOMMENDATIONS,
): RecommendedProduct[] | null {
  if (!isProductIndexReady()) {
    return null;
  }

  const terms = [
    ...(filters.searchTerms ?? []),
    ...query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3),
  ].slice(0, 10);

  let candidates = listSellableProductIndexEntries().filter((entry) =>
    matchesCategories(entry, filters.categories),
  );

  if (terms.length > 0) {
    const matched = candidates.filter((entry) => matchesTerms(entry, terms));
    if (matched.length > 0) {
      candidates = matched;
    }
  }

  if (filters.preferDiscount) {
    const discounted = candidates.filter(
      (entry) => (entry.discountPercent ?? 0) > 0,
    );
    if (discounted.length > 0) {
      candidates = discounted;
    }
  }

  if (filters.maxPrice != null) {
    candidates = candidates.filter(
      (entry) => entry.effectivePrice <= filters.maxPrice!,
    );
  }

  if (filters.minPrice != null) {
    candidates = candidates.filter(
      (entry) => entry.effectivePrice >= filters.minPrice!,
    );
  }

  let sorted = sortEntries(candidates, filters.sortBy ?? "popular");

  if (sorted.length === 0 && filters.maxPrice != null) {
    sorted = sortEntries(
      listSellableProductIndexEntries().filter(
        (entry) => entry.effectivePrice <= filters.maxPrice!,
      ),
      "price_asc",
    );
  }

  return sorted.slice(0, limit).map(toRecommendedProduct);
}
