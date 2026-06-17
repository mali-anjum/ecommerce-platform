export type ReviewThemeSlug =
  | "battery_life"
  | "packaging_damage"
  | "delivery_delays"
  | "product_quality"
  | "customer_service"
  | "pricing"
  | "sizing_fit"
  | "other";

export type ReviewThemeDefinition = {
  slug: ReviewThemeSlug;
  label: string;
  patterns: RegExp[];
};

export const REVIEW_THEME_TAXONOMY: ReviewThemeDefinition[] = [
  {
    slug: "battery_life",
    label: "Battery life",
    patterns: [
      /\bbattery\b/i,
      /\bcharge\b/i,
      /\bcharging\b/i,
      /\bpower drain\b/i,
      /\bdoesn'?t last\b/i,
    ],
  },
  {
    slug: "packaging_damage",
    label: "Packaging damage",
    patterns: [
      /\bpackag/i,
      /\bbox\b/i,
      /\bdamaged\b/i,
      /\bbroken\b/i,
      /\bcrushed\b/i,
      /\bdent(ed)?\b/i,
    ],
  },
  {
    slug: "delivery_delays",
    label: "Delivery delays",
    patterns: [
      /\bdeliver/i,
      /\bshipp/i,
      /\barriv/i,
      /\bslow\b/i,
      /\blate\b/i,
      /\bdelay/i,
      /\bwaiting\b/i,
      /\bcourier\b/i,
    ],
  },
  {
    slug: "product_quality",
    label: "Product quality",
    patterns: [
      /\bquality\b/i,
      /\bcheap\b/i,
      /\bdefect/i,
      /\bbroke\b/i,
      /\bnot as described\b/i,
      /\bfaulty\b/i,
    ],
  },
  {
    slug: "customer_service",
    label: "Customer service",
    patterns: [
      /\bsupport\b/i,
      /\brefund\b/i,
      /\breturn\b/i,
      /\bcustomer service\b/i,
      /\bresponse time\b/i,
    ],
  },
  {
    slug: "pricing",
    label: "Pricing",
    patterns: [/\bprice\b/i, /\bexpensive\b/i, /\boverpriced\b/i, /\bvalue\b/i],
  },
  {
    slug: "sizing_fit",
    label: "Sizing & fit",
    patterns: [
      /\bsize\b/i,
      /\bfit\b/i,
      /\btight\b/i,
      /\btoo small\b/i,
      /\btoo large\b/i,
    ],
  },
];

export function themeLabelForSlug(slug: string): string {
  const match = REVIEW_THEME_TAXONOMY.find((entry) => entry.slug === slug);
  return match?.label ?? slug.replace(/_/g, " ");
}
