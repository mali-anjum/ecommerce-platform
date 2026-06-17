import type { RecommendationFilters } from "../types";
import {
  parseRecommendationFilters,
} from "../classification/parsers/RecommendationParser";

export type SmartSearchIntent = {
  summary: string;
  productTerms: string[];
  features: string[];
  useCase: string | null;
  filters: RecommendationFilters;
};

const NATURAL_LANGUAGE_SIGNALS =
  /\b(i need|i want|i'?m looking for|looking for|help me find|show me|find me a|find a|something for|under\s*\$?\s*\d|below\s*\$?\s*\d|less than\s*\$?\s*\d|for fps|for gaming|wireless|bluetooth|ergonomic|budget-friendly)\b/i;

const PRODUCT_TERM_PATTERNS: Array<{ pattern: RegExp; terms: string[] }> = [
  { pattern: /\b(gaming mouse|mouse|mice)\b/i, terms: ["mouse", "gaming"] },
  { pattern: /\b(keyboard|keyboards)\b/i, terms: ["keyboard"] },
  { pattern: /\b(headphone|headphones|headset|earbud|earbuds)\b/i, terms: ["headphone", "audio"] },
  { pattern: /\b(laptop|laptops|notebook)\b/i, terms: ["laptop"] },
  { pattern: /\b(phone|smartphone|iphone|android)\b/i, terms: ["phone", "smartphone"] },
  { pattern: /\b(monitor|display)\b/i, terms: ["monitor"] },
  { pattern: /\b(sneaker|sneakers|shoe|shoes)\b/i, terms: ["sneaker", "shoe"] },
  { pattern: /\b(dress|shirt|jacket|jeans)\b/i, terms: ["fashion", "apparel"] },
];

const FEATURE_PATTERNS: Array<{ pattern: RegExp; feature: string }> = [
  { pattern: /\bwireless\b/i, feature: "wireless" },
  { pattern: /\bbluetooth\b/i, feature: "bluetooth" },
  { pattern: /\brechargeable\b/i, feature: "rechargeable" },
  { pattern: /\bnoise.?cancelling\b/i, feature: "noise cancelling" },
  { pattern: /\bmechanical\b/i, feature: "mechanical" },
  { pattern: /\brgb\b/i, feature: "rgb" },
  { pattern: /\bwaterproof\b/i, feature: "waterproof" },
  { pattern: /\blightweight\b/i, feature: "lightweight" },
];

function extractUseCase(message: string): string | null {
  const fps = message.match(/\bfor\s+(fps|competitive|esports)\b/i);
  if (fps) return "FPS gaming";

  const gaming = message.match(/\bfor\s+gaming\b/i);
  if (gaming) return "gaming";

  const work = message.match(/\bfor\s+(work|office|productivity)\b/i);
  if (work) return "work";

  const travel = message.match(/\bfor\s+(travel|commute)\b/i);
  if (travel) return "travel";

  return null;
}

function extractProductTerms(message: string): string[] {
  const terms = new Set<string>();
  const lower = message.toLowerCase();

  for (const entry of PRODUCT_TERM_PATTERNS) {
    if (entry.pattern.test(message)) {
      for (const term of entry.terms) {
        terms.add(term);
      }
    }
  }

  for (const entry of FEATURE_PATTERNS) {
    if (entry.pattern.test(message)) {
      terms.add(entry.feature);
    }
  }

  const words = lower
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);

  for (const word of words) {
    if (!["need", "want", "looking", "games", "game", "under", "below"].includes(word)) {
      terms.add(word);
    }
  }

  return Array.from(terms).slice(0, 12);
}

function extractFeatures(message: string): string[] {
  return FEATURE_PATTERNS.filter((entry) => entry.pattern.test(message)).map(
    (entry) => entry.feature,
  );
}

function buildSummary(intent: Omit<SmartSearchIntent, "summary" | "filters"> & {
  filters: RecommendationFilters;
}): string {
  const parts: string[] = [];

  if (intent.productTerms.length > 0) {
    parts.push(intent.productTerms.slice(0, 4).join(", "));
  }
  if (intent.useCase) {
    parts.push(`for ${intent.useCase}`);
  }
  if (intent.filters.maxPrice != null) {
    parts.push(`under $${intent.filters.maxPrice}`);
  }
  if (intent.features.length > 0) {
    parts.push(intent.features.join(", "));
  }

  return parts.length > 0 ? parts.join(" · ") : "your search";
}

export function isSmartSearchQuery(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length < 8) return false;

  const wordCount = trimmed.split(/\s+/).length;
  if (NATURAL_LANGUAGE_SIGNALS.test(trimmed)) return true;

  return wordCount >= 5;
}

export function parseSmartSearchIntent(query: string): SmartSearchIntent {
  const filters = parseRecommendationFilters(query);
  const productTerms = extractProductTerms(query);
  const features = extractFeatures(query);
  const useCase = extractUseCase(query);

  const mergedTerms = Array.from(
    new Set([...(filters.searchTerms ?? []), ...productTerms, ...features]),
  );

  return {
    summary: buildSummary({ productTerms, features, useCase, filters }),
    productTerms,
    features,
    useCase,
    filters: {
      ...filters,
      searchTerms: mergedTerms,
    },
  };
}
