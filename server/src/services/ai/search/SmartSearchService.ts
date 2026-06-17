import { completeChat, isAiConfigured } from "../../../config/ai";
import { getProductRecommendations } from "../recommendations/ProductRecommendationService";
import type { RecommendedProduct, RecommendationFilters } from "../types";
import {
  isSmartSearchQuery,
  parseSmartSearchIntent,
  type SmartSearchIntent,
} from "./SmartSearchIntentParser";

export type SmartSearchResult = {
  query: string;
  intentSummary: string;
  understoodIntent: SmartSearchIntent;
  filtersApplied: RecommendationFilters;
  products: RecommendedProduct[];
  total: number;
  usedAi: boolean;
};

const DEFAULT_LIMIT = 24;

function scoreProduct(
  product: RecommendedProduct,
  intent: SmartSearchIntent,
): number {
  const haystack = [
    product.name,
    product.brand,
    product.category,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  for (const term of intent.productTerms) {
    if (haystack.includes(term.toLowerCase())) score += 3;
  }

  for (const feature of intent.features) {
    if (haystack.includes(feature.toLowerCase())) score += 2;
  }

  if (intent.useCase?.toLowerCase().includes("fps") || intent.useCase?.toLowerCase().includes("gaming")) {
    if (/\bgaming\b/i.test(haystack) || /\bmouse\b/i.test(haystack)) score += 2;
  }

  if (intent.filters.maxPrice != null && product.effectivePrice <= intent.filters.maxPrice) {
    score += 2;
  }

  score += (product.rating ?? 0) * 0.5;
  score += Math.min(product.stock > 0 ? 1 : 0, 1);

  return score;
}

async function refineIntentWithAi(
  query: string,
  baseline: SmartSearchIntent,
): Promise<SmartSearchIntent> {
  if (!isAiConfigured()) return baseline;

  try {
    const raw = await completeChat({
      temperature: 0.1,
      maxTokens: 280,
      messages: [
        {
          role: "system",
          content:
            'Parse ecommerce product search intent. JSON only: {"productTerms":["word"],"features":["wireless"],"useCase":"FPS gaming|null","maxPrice":number|null,"minPrice":number|null,"categories":["Electronics"],"summary":"short phrase"}.',
        },
        { role: "user", content: query },
      ],
    });
    if (!raw) return baseline;

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const parsed = JSON.parse(
      jsonStart >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw,
    ) as {
      productTerms?: string[];
      features?: string[];
      useCase?: string | null;
      maxPrice?: number | null;
      minPrice?: number | null;
      categories?: string[];
      summary?: string;
    };

    const filters: RecommendationFilters = {
      ...baseline.filters,
      maxPrice:
        typeof parsed.maxPrice === "number"
          ? parsed.maxPrice
          : baseline.filters.maxPrice,
      minPrice:
        typeof parsed.minPrice === "number"
          ? parsed.minPrice
          : baseline.filters.minPrice,
      categories:
        Array.isArray(parsed.categories) && parsed.categories.length > 0
          ? parsed.categories.filter((c): c is string => typeof c === "string")
          : baseline.filters.categories,
      searchTerms: Array.from(
        new Set([
          ...(baseline.filters.searchTerms ?? []),
          ...(parsed.productTerms ?? []),
          ...(parsed.features ?? []),
        ]),
      ),
    };

    return {
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim().length > 0
          ? parsed.summary.trim()
          : baseline.summary,
      productTerms:
        Array.isArray(parsed.productTerms) && parsed.productTerms.length > 0
          ? parsed.productTerms.filter((t): t is string => typeof t === "string")
          : baseline.productTerms,
      features:
        Array.isArray(parsed.features) && parsed.features.length > 0
          ? parsed.features.filter((f): f is string => typeof f === "string")
          : baseline.features,
      useCase:
        typeof parsed.useCase === "string" && parsed.useCase.trim().length > 0
          ? parsed.useCase.trim()
          : baseline.useCase,
      filters,
    };
  } catch {
    return baseline;
  }
}

export async function runSmartSearch(
  query: string,
  options?: { limit?: number },
): Promise<SmartSearchResult> {
  const trimmed = query.trim();
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const baseline = parseSmartSearchIntent(trimmed);
  const understoodIntent = await refineIntentWithAi(trimmed, baseline);
  const usedAi = isAiConfigured();

  const recommendation = await getProductRecommendations(trimmed, understoodIntent.filters, {
    limit,
  });

  const ranked = [...recommendation.products]
    .map((product) => ({ product, score: scoreProduct(product, understoodIntent) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);

  return {
    query: trimmed,
    intentSummary: understoodIntent.summary,
    understoodIntent,
    filtersApplied: recommendation.filtersApplied,
    products: ranked,
    total: ranked.length,
    usedAi,
  };
}

export { isSmartSearchQuery };
