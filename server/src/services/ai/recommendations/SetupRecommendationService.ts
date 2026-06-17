import { prisma } from "../../../lib/prisma";
import { isFeatureEnabled } from "../../../config/featureFlags";
import { collectBehaviorSignals } from "../sales/BehaviorSignalService";
import type {
  RecommendedProduct,
  SetupRecommendationResult,
  SetupRecommendationSource,
} from "../types";
import { getProductRecommendations } from "./ProductRecommendationService";
import { analyzeSetupIntent } from "./SetupIntentAnalyzer";

const MAX_SETUP_PRODUCTS = 6;

const anchorSelect = {
  id: true,
  name: true,
  brand: true,
  category: true,
  description: true,
} as const;

export async function getSetupRecommendations(input: {
  productId: string;
  sessionId?: string;
  userId?: string;
  visitorId?: string;
}): Promise<SetupRecommendationResult | null> {
  if (!isFeatureEnabled("ai.productRecommendations")) {
    return null;
  }

  const anchor = await prisma.product.findFirst({
    where: {
      id: input.productId,
      isActive: true,
      isArchived: false,
    },
    select: anchorSelect,
  });

  if (!anchor) {
    return null;
  }

  let basedOn: SetupRecommendationSource = "product_context";
  let viewedProducts: Awaited<ReturnType<typeof collectBehaviorSignals>>["viewedProducts"] =
    [];

  if (input.sessionId) {
    const signals = await collectBehaviorSignals({
      sessionId: input.sessionId,
      userId: input.userId,
      visitorId: input.visitorId,
    });
    viewedProducts = signals.viewedProducts.filter(
      (product) => product.id !== anchor.id,
    );
    if (viewedProducts.length > 0) {
      basedOn = "behavior";
    }
  }

  const setupIntent = await analyzeSetupIntent({
    anchor: {
      id: anchor.id,
      name: anchor.name,
      brand: anchor.brand,
      category: anchor.category,
      description: anchor.description,
    },
    viewedProducts,
  });

  const excludeIds = new Set([
    anchor.id,
    ...viewedProducts.map((product) => product.id),
  ]);

  const searchQuery = [
    anchor.name,
    anchor.category,
    setupIntent.setupTitle,
    ...setupIntent.complementaryCategories,
    ...setupIntent.themeKeywords,
  ].join(" ");

  const recommendation = await getProductRecommendations(searchQuery, {
    searchTerms: setupIntent.complementaryCategories,
    categories: setupIntent.complementaryCategories,
    sortBy: "popular",
  });

  const products = recommendation.products
    .filter((product) => !excludeIds.has(product.id))
    .slice(0, MAX_SETUP_PRODUCTS);

  if (products.length === 0) {
    const fallback = await getProductRecommendations(anchor.category, {
      categories: [anchor.category],
      sortBy: "popular",
    });
    const fallbackProducts = fallback.products
      .filter((product) => product.id !== anchor.id)
      .slice(0, MAX_SETUP_PRODUCTS);

    if (fallbackProducts.length === 0) {
      return null;
    }

    return buildResult(anchor, setupIntent, fallbackProducts, basedOn);
  }

  return buildResult(anchor, setupIntent, products, basedOn);
}

function buildResult(
  anchor: { id: string; name: string },
  setupIntent: { setupTitle: string; intentSummary: string },
  products: RecommendedProduct[],
  basedOn: SetupRecommendationSource,
): SetupRecommendationResult {
  return {
    setupTitle: setupIntent.setupTitle,
    intentSummary: setupIntent.intentSummary,
    anchorProductId: anchor.id,
    anchorProductName: anchor.name,
    products,
    basedOn,
  };
}
