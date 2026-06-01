import type { RecommendedProduct, RecommendationFilters } from "./types";

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function describeFilters(filters: RecommendationFilters): string {
  const parts: string[] = [];

  if (filters.categories && filters.categories.length > 0) {
    parts.push(filters.categories.slice(0, 2).join(" / "));
  }
  if (filters.maxPrice != null) {
    parts.push(`under ${formatMoney(filters.maxPrice)}`);
  }
  if (filters.minPrice != null) {
    parts.push(`over ${formatMoney(filters.minPrice)}`);
  }
  if (filters.preferDiscount) {
    parts.push("with deals");
  }

  return parts.length > 0 ? parts.join(", ") : "your criteria";
}

export function buildRecommendationReply(
  products: RecommendedProduct[],
  filters: RecommendationFilters,
): string {
  const criteria = describeFilters(filters);

  if (products.length === 0) {
    return `I could not find products matching ${criteria}. Try adjusting your budget or category, or browse the full catalog.`;
  }

  const highlights = products
    .slice(0, 3)
    .map(
      (product) =>
        `${product.name} (${formatMoney(product.effectivePrice)}${product.discountPercent ? `, ${product.discountPercent}% off` : ""})`,
    )
    .join("; ");

  return `Here ${products.length === 1 ? "is" : "are"} ${products.length} pick${products.length === 1 ? "" : "s"} for ${criteria}: ${highlights}. Tap a card below for details.`;
}
