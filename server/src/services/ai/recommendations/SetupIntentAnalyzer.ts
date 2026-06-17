import { completeChat, isAiConfigured } from "../../../config/ai";
import type { ViewedProductSummary } from "../sales/types";

export type SetupIntentAnalysis = {
  setupTitle: string;
  intentSummary: string;
  themeKeywords: string[];
  complementaryCategories: string[];
};

type AnchorProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
};

const SETUP_RULES: Array<{
  pattern: RegExp;
  setupTitle: string;
  intentSummary: string;
  keywords: string[];
  complementary: string[];
}> = [
  {
    pattern: /\b(camera|dslr|mirrorless|camcorder)\b/i,
    setupTitle: "Complete your photography kit",
    intentSummary: "Essential accessories for your camera",
    keywords: ["photography", "camera", "accessories"],
    complementary: ["tripod", "memory card", "camera bag", "lens", "cleaning kit", "strap"],
  },
  {
    pattern: /\b(laptop|notebook|macbook)\b/i,
    setupTitle: "Complete your workspace setup",
    intentSummary: "Gear to get the most from your laptop",
    keywords: ["laptop", "workspace", "accessories"],
    complementary: ["mouse", "keyboard", "hub", "sleeve", "stand", "monitor"],
  },
  {
    pattern: /\b(gaming|gpu|graphics card|console|playstation|xbox)\b/i,
    setupTitle: "Level up your gaming setup",
    intentSummary: "Peripherals that pair with your gear",
    keywords: ["gaming", "setup"],
    complementary: ["headset", "mouse", "keyboard", "mousepad", "controller", "monitor"],
  },
  {
    pattern: /\b(phone|iphone|android|smartphone|galaxy)\b/i,
    setupTitle: "Complete your mobile kit",
    intentSummary: "Must-have accessories for your phone",
    keywords: ["mobile", "phone", "accessories"],
    complementary: ["case", "charger", "cable", "screen protector", "earbuds", "power bank"],
  },
  {
    pattern: /\b(monitor|display|screen)\b/i,
    setupTitle: "Optimize your display setup",
    intentSummary: "Accessories for a better viewing experience",
    keywords: ["monitor", "display", "desk"],
    complementary: ["arm", "cable", "hub", "light", "desk", "speaker"],
  },
  {
    pattern: /\b(headphone|earbud|speaker|audio)\b/i,
    setupTitle: "Enhance your audio experience",
    intentSummary: "Complements for your sound gear",
    keywords: ["audio", "music"],
    complementary: ["dac", "amp", "case", "cable", "stand", "adapter"],
  },
];

function analyzeAnchorWithRules(anchor: AnchorProduct): SetupIntentAnalysis {
  const haystack = [anchor.name, anchor.brand, anchor.category, anchor.description]
    .join(" ")
    .toLowerCase();

  for (const rule of SETUP_RULES) {
    if (rule.pattern.test(haystack)) {
      return {
        setupTitle: rule.setupTitle,
        intentSummary: rule.intentSummary,
        themeKeywords: rule.keywords,
        complementaryCategories: rule.complementary,
      };
    }
  }

  const category = anchor.category.trim();
  return {
    setupTitle: category ? `Complete your ${category.toLowerCase()} setup` : "Recommended for you",
    intentSummary: `Accessories that pair well with ${anchor.name}`,
    themeKeywords: category.toLowerCase().split(/\s+/).filter(Boolean),
    complementaryCategories: category ? [category, "accessories"] : ["accessories"],
  };
}

function mergeBehaviorContext(
  anchor: SetupIntentAnalysis,
  viewed: ViewedProductSummary[],
): SetupIntentAnalysis {
  if (viewed.length === 0) return anchor;

  const extraTerms = new Set(anchor.complementaryCategories);
  for (const product of viewed) {
    for (const term of product.category.toLowerCase().split(/\s+/)) {
      if (term.length > 2) extraTerms.add(term);
    }
  }

  return {
    ...anchor,
    intentSummary: `${anchor.intentSummary} — informed by your recent browsing`,
    complementaryCategories: [...extraTerms].slice(0, 12),
  };
}

export async function analyzeSetupIntent(input: {
  anchor: AnchorProduct;
  viewedProducts?: ViewedProductSummary[];
}): Promise<SetupIntentAnalysis> {
  const ruleBased = analyzeAnchorWithRules(input.anchor);
  const withBehavior = mergeBehaviorContext(
    ruleBased,
    input.viewedProducts ?? [],
  );

  if (!isAiConfigured()) {
    return withBehavior;
  }

  try {
    const viewedLines =
      input.viewedProducts && input.viewedProducts.length > 0
        ? input.viewedProducts
            .map((product) => `- ${product.name} (${product.category})`)
            .join("\n")
        : "None";

    const raw = await completeChat({
      temperature: 0.2,
      maxTokens: 220,
      messages: [
        {
          role: "system",
          content:
            'You suggest ecommerce "complete the setup" accessory bundles. Reply JSON only: {"setupTitle":"short title","intentSummary":"one sentence","themeKeywords":["word"],"complementaryCategories":["accessory type"]}. Exclude the anchor product type from recommendations.',
        },
        {
          role: "user",
          content: `Anchor product: ${input.anchor.name} (${input.anchor.category}) — ${input.anchor.description.slice(0, 400)}

Recently viewed:
${viewedLines}

Suggest 6-8 complementary accessory categories (e.g. camera → tripod, memory card, bag).`,
        },
      ],
    });
    if (!raw) return withBehavior;

    const parsed = JSON.parse(raw) as Partial<SetupIntentAnalysis>;
    if (typeof parsed.setupTitle === "string" && parsed.setupTitle.length > 0) {
      return {
        setupTitle: parsed.setupTitle,
        intentSummary:
          typeof parsed.intentSummary === "string" && parsed.intentSummary.length > 0
            ? parsed.intentSummary
            : withBehavior.intentSummary,
        themeKeywords: Array.isArray(parsed.themeKeywords)
          ? parsed.themeKeywords.filter((item): item is string => typeof item === "string")
          : withBehavior.themeKeywords,
        complementaryCategories: Array.isArray(parsed.complementaryCategories)
          ? parsed.complementaryCategories.filter(
              (item): item is string => typeof item === "string",
            )
          : withBehavior.complementaryCategories,
      };
    }
  } catch {
    // Fall back to deterministic rules when LLM output is unavailable.
  }

  return withBehavior;
}
