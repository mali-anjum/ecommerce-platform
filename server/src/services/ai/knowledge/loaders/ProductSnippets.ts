import type { AssistantProductSnippet } from "../../types";
import { scoreFields } from "../relevance";

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

/** Name matches outrank brand/category, which outrank description-only matches. */
export function scoreProductRelevance(
  product: { name: string; brand: string; category: string; description: string },
  terms: string[],
): number {
  return scoreFields(
    [
      { text: product.name, weight: 3 },
      { text: product.brand, weight: 2 },
      { text: product.category, weight: 2 },
      { text: product.description, weight: 1 },
    ],
    terms,
  );
}
