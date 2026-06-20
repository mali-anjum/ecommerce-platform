import { completeChat, isAiConfigured } from "../../../config/ai";
import {
  REVIEW_THEME_TAXONOMY,
  type ReviewThemeSlug,
} from "./ReviewThemeTaxonomy";

export type ReviewClassification = {
  themes: ReviewThemeSlug[];
  sentiment: "positive" | "neutral" | "negative";
};

function inferSentiment(rating: number, body: string): ReviewClassification["sentiment"] {
  if (rating <= 2) return "negative";
  if (rating >= 4) return "positive";
  if (/\b(bad|terrible|awful|hate|worst|broken|damaged|slow|late)\b/i.test(body)) {
    return "negative";
  }
  if (/\b(great|excellent|love|perfect|amazing|fast)\b/i.test(body)) {
    return "positive";
  }
  return "neutral";
}

export function classifyReviewWithRules(input: {
  rating: number;
  body: string;
}): ReviewClassification {
  const themes = new Set<ReviewThemeSlug>();

  for (const theme of REVIEW_THEME_TAXONOMY) {
    if (theme.patterns.some((pattern) => pattern.test(input.body))) {
      themes.add(theme.slug);
    }
  }

  if (themes.size === 0) {
    themes.add("other");
  }

  return {
    themes: Array.from(themes),
    sentiment: inferSentiment(input.rating, input.body),
  };
}

export async function classifyReviewsBatch(
  reviews: Array<{ id: string; rating: number; body: string }>,
): Promise<Map<string, ReviewClassification>> {
  const results = new Map<string, ReviewClassification>();

  for (const review of reviews) {
    results.set(review.id, classifyReviewWithRules(review));
  }

  if (!isAiConfigured() || reviews.length === 0) {
    return results;
  }

  try {
    const taxonomy = REVIEW_THEME_TAXONOMY.map((entry) => entry.slug).join(", ");
    const payload = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body.slice(0, 500),
    }));

    const raw = await completeChat({
      temperature: 0.1,
      maxTokens: 1200,
      messages: [
        {
          role: "system",
          content: `You classify ecommerce product reviews. Reply with JSON only: {"reviews":[{"id":"uuid","themes":["slug"],"sentiment":"positive|neutral|negative"}]}. Theme slugs must be from: ${taxonomy}, other.`,
        },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    });
    if (!raw) return results;

    const parsed = JSON.parse(raw) as {
      reviews?: Array<{
        id?: string;
        themes?: string[];
        sentiment?: string;
      }>;
    };

    for (const entry of parsed.reviews ?? []) {
      if (!entry.id || !results.has(entry.id)) continue;
      const fallback = results.get(entry.id)!;
      const themes = (entry.themes ?? []).filter(
        (slug): slug is ReviewThemeSlug =>
          typeof slug === "string" &&
          (REVIEW_THEME_TAXONOMY.some((theme) => theme.slug === slug) ||
            slug === "other"),
      );
      const sentiment =
        entry.sentiment === "positive" ||
        entry.sentiment === "neutral" ||
        entry.sentiment === "negative"
          ? entry.sentiment
          : fallback.sentiment;

      results.set(entry.id, {
        themes: themes.length > 0 ? themes : fallback.themes,
        sentiment,
      });
    }
  } catch {
    // Rule-based results already populated.
  }

  return results;
}
