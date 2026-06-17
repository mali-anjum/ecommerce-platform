export type SeoTone = "professional" | "friendly" | "premium";

export type SeoContentResult = {
  title: string;
  metaDescription: string;
  keywords: string[];
  productDescription: string;
};

export type SeoGeneratorRequest = {
  productName: string;
  category?: string;
  brand?: string;
  tone?: SeoTone;
  storeName?: string;
};
