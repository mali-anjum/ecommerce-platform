export type ProductPricingInput = {
  price: number;
  discountPercent?: number | null;
  dealStartsAt?: Date | string | null;
  dealEndsAt?: Date | string | null;
};

export type ProductPricingResult = {
  price: number;
  salePrice: number | null;
  discountPercent: number | null;
  hasActiveDeal: boolean;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Computes list vs sale price from catalog fields (same rules on server responses). */
export function computeProductPricing(
  product: ProductPricingInput,
  now: Date = new Date()
): ProductPricingResult {
  const discount = product.discountPercent ?? 0;
  const dealStartsAt = toDate(product.dealStartsAt);
  const dealEndsAt = toDate(product.dealEndsAt);

  const dealStarted = !dealStartsAt || dealStartsAt <= now;
  const dealNotEnded = !dealEndsAt || dealEndsAt >= now;
  const hasActiveDeal =
    discount > 0 && discount < 100 && dealStarted && dealNotEnded;

  const salePrice = hasActiveDeal
    ? Math.round(product.price * (1 - discount / 100) * 100) / 100
    : null;

  return {
    price: product.price,
    salePrice,
    discountPercent: hasActiveDeal ? discount : null,
    hasActiveDeal,
  };
}

export function getEffectiveUnitPrice(pricing: ProductPricingResult): number {
  return pricing.salePrice ?? pricing.price;
}
