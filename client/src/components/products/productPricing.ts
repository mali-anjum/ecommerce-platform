export type ProductPricingInput = {
  price: number;
  discountPercent?: number | null;
  dealStartsAt?: string | null;
  dealEndsAt?: string | null;
};

export type ProductPricingResult = {
  price: number;
  salePrice: number | null;
  discountPercent: number | null;
  hasActiveDeal: boolean;
};

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeProductPricing(
  product: ProductPricingInput,
  now: Date = new Date()
): ProductPricingResult {
  const discount = product.discountPercent ?? 0;
  const dealStartsAt = toDate(product.dealStartsAt ?? null);
  const dealEndsAt = toDate(product.dealEndsAt ?? null);

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

export function getDisplayPrice(pricing: {
  price: number;
  salePrice: number | null;
}): number {
  return pricing.salePrice ?? pricing.price;
}
