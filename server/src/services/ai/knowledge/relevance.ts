/**
 * Keyword relevance helpers shared by the assistant context loaders and the product index.
 * Deliberately simple (no embeddings) — see docs/ai/RAG-UPGRADE-STRATEGY.md for when to replace it.
 */

const COMMON_STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "be", "what", "how", "when", "where", "why", "which",
  "who", "do", "does", "did", "you", "your", "we", "our", "i", "my", "me", "this", "that",
  "these", "those", "about", "for", "and", "or", "but", "can", "could", "would", "should",
  "will", "please", "tell", "explain", "with", "from", "any", "have", "has", "there", "they",
  "them", "it", "its", "into", "than", "then", "also", "just", "some", "get", "got", "know",
  "hello", "thanks", "thank", "hey",
]);

// Store/help vocabulary: useful for matching FAQs and docs, but noise when matching products.
const STORE_VOCABULARY = new Set([
  "ship", "shipping", "ships", "delivery", "deliver", "return", "returns", "refund", "refunds",
  "policy", "policies", "product", "products", "item", "items", "store", "shop", "order",
  "orders", "buy", "need", "want", "looking", "show", "best", "good", "recommend",
  "international", "warranty", "coupon", "coupons", "discount", "code", "help", "support",
]);

const MAX_TERMS = 6;

function tokenize(message: string, stopWords: (word: string) => boolean): string[] {
  const words = message
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords(word));
  return [...new Set(words)].slice(0, MAX_TERMS);
}

/** Terms for matching FAQs, policies, and knowledge documents. */
export function extractKeywords(message: string): string[] {
  return tokenize(message, (word) => COMMON_STOP_WORDS.has(word));
}

/** Terms for matching products (drops store/help vocabulary as well). */
export function extractSearchTerms(message: string): string[] {
  return tokenize(
    message,
    (word) => COMMON_STOP_WORDS.has(word) || STORE_VOCABULARY.has(word),
  );
}

/** Naive singular form so "laptops" matches "laptop" and "watches" matches "watch". */
export function singularize(term: string): string {
  if (term.length > 4 && term.endsWith("ies")) return `${term.slice(0, -3)}y`;
  if (term.length > 4 && /(ches|shes|sses|xes|zes)$/.test(term)) return term.slice(0, -2);
  if (term.length > 3 && term.endsWith("s") && !term.endsWith("ss")) return term.slice(0, -1);
  return term;
}

function textHasTerm(text: string, term: string): boolean {
  if (text.includes(term)) return true;
  const singular = singularize(term);
  return singular !== term && text.includes(singular);
}

export type WeightedField = { text: string; weight: number };

/** Sum, per term, of the highest weight among fields containing it. 0 = no match. */
export function scoreFields(fields: WeightedField[], terms: string[]): number {
  if (terms.length === 0) return 0;
  const lowered = fields.map((field) => ({ text: field.text.toLowerCase(), weight: field.weight }));
  let score = 0;
  for (const term of terms) {
    let best = 0;
    for (const field of lowered) {
      if (field.weight > best && textHasTerm(field.text, term)) best = field.weight;
    }
    score += best;
  }
  return score;
}

/** Stable sort by score (desc) and keep the top `limit`; ties keep their original order. */
export function rankByScore<T>(items: T[], score: (item: T) => number, limit: number): T[] {
  return items
    .map((item, index) => ({ item, index, score: score(item) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ item }) => item);
}

/**
 * Trim long text to the paragraphs that mention the terms, in original order, within maxChars.
 * Falls back to the leading slice when nothing matches.
 */
export function excerptRelevant(content: string, terms: string[], maxChars: number): string {
  if (content.length <= maxChars) return content;

  const paragraphs = content.split(/\n\s*\n/).map((text, index) => ({
    text: text.trim(),
    index,
    score: scoreFields([{ text, weight: 1 }], terms),
  }));
  const matching = paragraphs.filter((p) => p.score > 0 && p.text.length > 0);
  if (matching.length === 0) return `${content.slice(0, maxChars)}…`;

  const chosen: typeof matching = [];
  let used = 0;
  for (const paragraph of [...matching].sort((a, b) => b.score - a.score || a.index - b.index)) {
    const text = paragraph.text.length > maxChars ? paragraph.text.slice(0, maxChars) : paragraph.text;
    if (used + text.length > maxChars) continue;
    chosen.push({ ...paragraph, text });
    used += text.length;
  }
  if (chosen.length === 0) return `${content.slice(0, maxChars)}…`;

  return chosen
    .sort((a, b) => a.index - b.index)
    .map((p) => p.text)
    .join("\n…\n");
}
