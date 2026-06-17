import type { RecommendedProduct } from "@/lib/assistant/types";

export type SetupRecommendationSource = "behavior" | "product_context";

export type AiRecommendedSetup = {
  setupTitle: string;
  intentSummary: string;
  anchorProductId: string;
  anchorProductName: string;
  products: RecommendedProduct[];
  basedOn: SetupRecommendationSource;
};
