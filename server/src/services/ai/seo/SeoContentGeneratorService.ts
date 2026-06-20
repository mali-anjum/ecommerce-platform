import { completeChat, isAiConfigured } from "../../../config/ai";
import { ApiError } from "../../../utils/ApiError";

export type SeoContentInput = {
  productName: string;
  category?: string;
  brand?: string;
  tone?: "professional" | "friendly" | "premium";
  storeName?: string;
};

export type SeoContentResult = {
  title: string;
  metaDescription: string;
  keywords: string[];
  productDescription: string;
};

const META_MAX = 160;
const TITLE_MAX = 70;

function clampMeta(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= META_MAX) return trimmed;
  return `${trimmed.slice(0, META_MAX - 3).trim()}...`;
}

function clampTitle(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= TITLE_MAX) return trimmed;
  return trimmed.slice(0, TITLE_MAX).trim();
}

function slugWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function buildKeywords(input: SeoContentInput): string[] {
  const words = slugWords(input.productName);
  const extras = [
    input.category?.toLowerCase(),
    input.brand?.toLowerCase(),
    "buy online",
    "free shipping",
  ].filter((item): item is string => Boolean(item));

  return Array.from(new Set([...words, ...extras])).slice(0, 12);
}

function buildRuleBasedContent(input: SeoContentInput): SeoContentResult {
  const store = input.storeName?.trim() || "Our Store";
  const category = input.category?.trim();
  const brand = input.brand?.trim();
  const title = clampTitle(
    brand
      ? `${input.productName} by ${brand} | ${store}`
      : `${input.productName} | Shop ${category ?? "Electronics"} | ${store}`,
  );

  const metaDescription = clampMeta(
    category
      ? `Shop ${input.productName} in ${category}. ${brand ? `${brand} quality. ` : ""}Fast shipping, secure checkout, and trusted seller support at ${store}.`
      : `Discover ${input.productName} at ${store}. Compare features, read reviews, and order with fast delivery and easy returns.`,
  );

  const descriptionParagraphs = [
    `Meet the ${input.productName}${brand ? ` from ${brand}` : ""} — built for shoppers who want reliable performance without the hassle.`,
    category
      ? `Designed for the ${category} aisle, it balances everyday usability with the details enthusiasts notice first.`
      : `Whether you are upgrading your setup or buying a gift, this product delivers a straightforward, confidence-inspiring experience.`,
    `Order from ${store} for secure checkout, responsive support, and delivery you can track from cart to doorstep.`,
  ];

  return {
    title,
    metaDescription,
    keywords: buildKeywords(input),
    productDescription: descriptionParagraphs.join("\n\n"),
  };
}

function normalizeResult(
  raw: Partial<SeoContentResult>,
  fallback: SeoContentResult,
): SeoContentResult {
  const title =
    typeof raw.title === "string" && raw.title.trim().length > 0
      ? clampTitle(raw.title)
      : fallback.title;

  const metaDescription =
    typeof raw.metaDescription === "string" && raw.metaDescription.trim().length > 0
      ? clampMeta(raw.metaDescription)
      : fallback.metaDescription;

  const keywords = Array.isArray(raw.keywords)
    ? raw.keywords
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim().toLowerCase())
        .slice(0, 15)
    : fallback.keywords;

  const productDescription =
    typeof raw.productDescription === "string" &&
    raw.productDescription.trim().length > 0
      ? raw.productDescription.trim()
      : fallback.productDescription;

  return {
    title,
    metaDescription,
    keywords: keywords.length > 0 ? keywords : fallback.keywords,
    productDescription,
  };
}

export async function generateSeoContent(
  input: SeoContentInput,
): Promise<SeoContentResult> {
  const productName = input.productName.trim();
  if (productName.length < 2) {
    throw new ApiError(400, "Product name must be at least 2 characters");
  }

  const fallback = buildRuleBasedContent({ ...input, productName });

  if (!isAiConfigured()) {
    return fallback;
  }

  try {
    const tone = input.tone ?? "professional";
    const hints = [
      `Product name: ${productName}`,
      input.category ? `Category: ${input.category}` : null,
      input.brand ? `Brand: ${input.brand}` : null,
      input.storeName ? `Store: ${input.storeName}` : null,
      `Tone: ${tone}`,
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await completeChat({
      temperature: 0.4,
      maxTokens: 900,
      messages: [
        {
          role: "system",
          content:
            'You write ecommerce SEO copy. Reply with JSON only: {"title":"max 70 chars","metaDescription":"max 160 chars","keywords":["word"],"productDescription":"2-4 short paragraphs, plain text with line breaks"}. Title must include the product name. Meta description must be compelling for click-through. Keywords: 8-12 lowercase phrases. No markdown.',
        },
        {
          role: "user",
          content: hints,
        },
      ],
    });
    if (!raw) return fallback;

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const jsonText =
      jsonStart >= 0 && jsonEnd > jsonStart
        ? raw.slice(jsonStart, jsonEnd + 1)
        : raw;

    const parsed = JSON.parse(jsonText) as Partial<SeoContentResult>;
    return normalizeResult(parsed, fallback);
  } catch {
    return fallback;
  }
}
