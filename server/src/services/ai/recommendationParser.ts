import { PRODUCT_CATEGORY_CATALOG } from "../../constants/productCategories";
import type { RecommendationFilters } from "./types";

const RECOMMENDATION_SIGNALS =
  /\b(recommend|suggestion|suggest|show me|find me|looking for|search for|best|top|cheap|affordable|budget|under|below|less than|deals?|discount)\b/i;

const POLICY_SIGNALS =
  /\b(return|refund|shipping|ship internationally|policy|track order|password|login)\b/i;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  laptop: ["laptop", "laptops", "notebook", "macbook"],
  smartphone: ["phone", "phones", "smartphone", "iphone", "android"],
  sneaker: ["sneaker", "sneakers", "shoe", "shoes", "trainer", "trainers"],
  audio: ["headphone", "headphones", "earbud", "earbuds", "speaker", "audio"],
  fashion: ["dress", "shirt", "jacket", "pants", "jeans", "apparel", "clothing"],
  beauty: ["skincare", "makeup", "perfume", "fragrance", "beauty"],
  home: ["furniture", "decor", "kitchen", "lighting", "home"],
};

function extractMaxPrice(message: string): number | undefined {
  const underMatch = message.match(
    /\b(?:under|below|less than|max|budget)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i,
  );
  if (underMatch) {
    return Number(underMatch[1]);
  }

  const dollarMatch = message.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (dollarMatch && /\b(under|below|cheap|budget|affordable)\b/i.test(message)) {
    return Number(dollarMatch[1]);
  }

  return undefined;
}

function extractMinPrice(message: string): number | undefined {
  const overMatch = message.match(
    /\b(?:over|above|more than|at least)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i,
  );
  return overMatch ? Number(overMatch[1]) : undefined;
}

function resolveCatalogCategories(message: string): string[] {
  const lower = message.toLowerCase();
  const matches = new Set<string>();

  for (const category of PRODUCT_CATEGORY_CATALOG) {
    if (lower.includes(category.title.toLowerCase())) {
      matches.add(category.title);
    }
    if (lower.includes(category.slug)) {
      matches.add(category.title);
    }
    for (const sub of category.subcategories) {
      if (
        lower.includes(sub.title.toLowerCase()) ||
        lower.includes(sub.slug)
      ) {
        matches.add(category.title);
        matches.add(sub.title);
      }
    }
  }

  for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      const primary = keywords.find((k) => lower.includes(k)) ?? keywords[0];
      if (primary.includes("laptop")) {
        matches.add("Electronics");
        matches.add("Laptops");
      } else if (
        primary.includes("phone") ||
        primary.includes("smartphone")
      ) {
        matches.add("Electronics");
        matches.add("Smartphones");
      } else if (
        primary.includes("sneaker") ||
        primary.includes("shoe") ||
        primary.includes("trainer")
      ) {
        matches.add("Fashion");
      } else if (primary.includes("headphone") || primary.includes("audio")) {
        matches.add("Electronics");
        matches.add("Audio");
      } else if (
        ["dress", "shirt", "jacket", "pants", "jeans", "apparel"].some((k) =>
          primary.includes(k),
        )
      ) {
        matches.add("Fashion");
      } else if (
        ["skincare", "makeup", "perfume", "fragrance", "beauty"].some((k) =>
          primary.includes(k),
        )
      ) {
        matches.add("Beauty");
      } else if (
        ["furniture", "decor", "kitchen", "lighting", "home"].some((k) =>
          primary.includes(k),
        )
      ) {
        matches.add("Home & Living");
      }
    }
  }

  return Array.from(matches);
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
    "me",
    "my",
    "show",
    "find",
    "best",
    "cheap",
    "under",
    "below",
    "less",
    "than",
    "budget",
    "recommend",
    "products",
    "product",
    "please",
    "some",
    "any",
    "for",
    "with",
    "and",
    "or",
  ]);

  const terms = message
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return Array.from(new Set(terms)).slice(0, 8);
}

export function isProductRecommendationQuery(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 4) {
    return false;
  }

  if (POLICY_SIGNALS.test(trimmed) && !RECOMMENDATION_SIGNALS.test(trimmed)) {
    return false;
  }

  if (RECOMMENDATION_SIGNALS.test(trimmed)) {
    return true;
  }

  const hasCategoryHint = resolveCatalogCategories(trimmed).length > 0;
  const hasPriceHint =
    extractMaxPrice(trimmed) != null || extractMinPrice(trimmed) != null;

  return hasCategoryHint && (hasPriceHint || /\b(laptop|sneaker|phone)\b/i.test(trimmed));
}

export function parseRecommendationFilters(message: string): RecommendationFilters {
  const lower = message.toLowerCase();
  const maxPrice = extractMaxPrice(message);
  const minPrice = extractMinPrice(message);
  const categories = resolveCatalogCategories(message);
  const searchTerms = extractSearchTerms(message);

  const preferDiscount =
    /\b(deal|deals|discount|sale|on sale|off)\b/i.test(message) ||
    (maxPrice != null && /\b(cheap|affordable|budget)\b/i.test(message));

  let sortBy: RecommendationFilters["sortBy"] = "popular";
  if (preferDiscount) {
    sortBy = "discount";
  } else if (/\b(cheap|affordable|budget|lowest)\b/i.test(lower)) {
    sortBy = "price_asc";
  } else if (/\b(expensive|premium|high-end)\b/i.test(lower)) {
    sortBy = "price_desc";
  } else if (/\b(best|top)\b/i.test(lower)) {
    sortBy = "popular";
  }

  return {
    maxPrice,
    minPrice,
    categories,
    searchTerms,
    preferDiscount,
    sortBy,
  };
}
