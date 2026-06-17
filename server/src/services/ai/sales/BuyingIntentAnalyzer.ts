import { completeChat, isAiConfigured } from "../../../config/ai";
import type { BuyingIntentAnalysis, ViewedProductSummary } from "./types";

const THEME_RULES: Array<{
  pattern: RegExp;
  summary: string;
  keywords: string[];
  complementary: string[];
}> = [
  {
    pattern: /\b(gaming|mouse|keyboard|monitor|headset|gpu|controller)\b/i,
    summary: "Likely building a gaming setup",
    keywords: ["gaming", "peripheral", "setup"],
    complementary: ["headset", "mousepad", "cable", "gaming"],
  },
  {
    pattern: /\b(laptop|desk|chair|monitor|keyboard|office)\b/i,
    summary: "Likely setting up a home office",
    keywords: ["office", "work", "productivity"],
    complementary: ["desk", "chair", "monitor", "keyboard"],
  },
  {
    pattern: /\b(phone|case|charger|cable|earbuds|tablet)\b/i,
    summary: "Likely upgrading mobile accessories",
    keywords: ["mobile", "accessories"],
    complementary: ["case", "charger", "cable", "earbuds"],
  },
  {
    pattern: /\b(camera|lens|tripod|light|photo)\b/i,
    summary: "Likely building a photography kit",
    keywords: ["photography", "camera"],
    complementary: ["lens", "tripod", "memory", "bag"],
  },
];

function analyzeWithRules(
  products: ViewedProductSummary[],
): BuyingIntentAnalysis {
  const haystack = products
    .map((product) =>
      [product.name, product.brand, product.category].join(" "),
    )
    .join(" ")
    .toLowerCase();

  for (const rule of THEME_RULES) {
    if (rule.pattern.test(haystack)) {
      return {
        intentSummary: rule.summary,
        themeKeywords: rule.keywords,
        complementaryCategories: rule.complementary,
      };
    }
  }

  const dominantCategory = dominantValue(products.map((product) => product.category));
  if (dominantCategory) {
    return {
      intentSummary: `Interested in ${dominantCategory.toLowerCase()} products`,
      themeKeywords: dominantCategory.toLowerCase().split(/\s+/).filter(Boolean),
      complementaryCategories: [dominantCategory],
    };
  }

  return {
    intentSummary: "Showing strong purchase interest",
    themeKeywords: [],
    complementaryCategories: [],
  };
}

function dominantValue(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

export async function analyzeBuyingIntent(
  products: ViewedProductSummary[],
): Promise<BuyingIntentAnalysis> {
  if (products.length === 0) {
    return {
      intentSummary: "Showing purchase interest",
      themeKeywords: [],
      complementaryCategories: [],
    };
  }

  const ruleBased = analyzeWithRules(products);
  if (!isAiConfigured() || products.length < 2) {
    return ruleBased;
  }

  try {
    const productList = products
      .map((product) => `- ${product.name} (${product.category})`)
      .join("\n");

    const raw = await completeChat({
      temperature: 0.2,
      maxTokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You analyze ecommerce browsing patterns. Reply with JSON only: {\"intentSummary\":\"short phrase\",\"themeKeywords\":[\"word\"],\"complementaryCategories\":[\"category\"]}.",
        },
        {
          role: "user",
          content: `Visitor viewed:\n${productList}\n\nWhat are they likely shopping for? Suggest complementary product categories.`,
        },
      ],
    });
    if (!raw) return ruleBased;

    const parsed = JSON.parse(raw) as Partial<BuyingIntentAnalysis>;
    if (
      typeof parsed.intentSummary === "string" &&
      parsed.intentSummary.length > 0
    ) {
      return {
        intentSummary: parsed.intentSummary,
        themeKeywords: Array.isArray(parsed.themeKeywords)
          ? parsed.themeKeywords.filter((item): item is string => typeof item === "string")
          : ruleBased.themeKeywords,
        complementaryCategories: Array.isArray(parsed.complementaryCategories)
          ? parsed.complementaryCategories.filter(
              (item): item is string => typeof item === "string",
            )
          : ruleBased.complementaryCategories,
      };
    }
  } catch {
    // Fall back to deterministic rules when LLM output is unavailable.
  }

  return ruleBased;
}
