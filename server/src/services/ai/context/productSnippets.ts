import type { AssistantProductSnippet } from "../types";

export const MAX_CONTEXT_PRODUCTS = 8;

export function toProductSnippet(product: {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  condition: string;
  discountPercent: number | null;
}): AssistantProductSnippet {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description.slice(0, 500),
    price: product.price,
    stock: product.stock,
    category: product.category,
    condition: product.condition,
    discountPercent: product.discountPercent,
  };
}

export function extractSearchTerms(message: string): string[] {
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
