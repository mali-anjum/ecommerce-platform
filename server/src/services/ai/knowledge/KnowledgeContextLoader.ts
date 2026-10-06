import { loadActiveCoupons } from "./loaders/LoadCoupons";
import { loadFaqs } from "./loaders/LoadFaqs";
import { loadKnowledgeDocuments } from "./loaders/LoadKnowledgeDocuments";
import { loadPolicies } from "./loaders/LoadPolicies";
import { loadRelevantProducts } from "./loaders/LoadProducts";
import { extractKeywords, rankByScore, scoreFields } from "./relevance";
import type {
  AssistantFaqSnippet,
  AssistantKnowledgeContext,
  ClassifiedIntent,
} from "../types";

type ContextPlan = {
  maxFaqs: number;
  maxDocs: number;
  padProductsWithFeatured: boolean;
};

// Help questions get more FAQ/doc room and no filler products; general chat the reverse.
const CONTEXT_PLANS: Partial<Record<ClassifiedIntent, ContextPlan>> = {
  FAQ: { maxFaqs: 8, maxDocs: 3, padProductsWithFeatured: false },
};
const DEFAULT_PLAN: ContextPlan = { maxFaqs: 5, maxDocs: 2, padProductsWithFeatured: true };

const COUPON_SIGNALS =
  /\b(coupons?|promo\w*|discounts?|deals?|sales?|offers?|vouchers?|codes?|savings?|cheap\w*)\b/i;

export function mentionsCoupons(message: string): boolean {
  return COUPON_SIGNALS.test(message);
}

export function selectRelevantFaqs(
  faqs: AssistantFaqSnippet[],
  message: string,
  limit: number,
): AssistantFaqSnippet[] {
  if (faqs.length <= limit) return faqs;
  const terms = extractKeywords(message);
  return rankByScore(
    faqs,
    (faq) =>
      scoreFields(
        [
          { text: faq.question, weight: 2 },
          { text: faq.answer, weight: 1 },
        ],
        terms,
      ),
    limit,
  );
}

export async function loadAssistantKnowledgeContext(
  message: string,
  productId?: string,
  intent: ClassifiedIntent = "GENERAL_CHAT",
): Promise<AssistantKnowledgeContext> {
  const plan = CONTEXT_PLANS[intent] ?? DEFAULT_PLAN;

  const [faqs, policies, products, coupons, documents] = await Promise.all([
    loadFaqs(),
    loadPolicies(),
    loadRelevantProducts(message, productId, {
      padWithFeatured: plan.padProductsWithFeatured,
    }),
    // Coupons are only useful when the shopper asks about savings; skip the query otherwise.
    mentionsCoupons(message) ? loadActiveCoupons() : Promise.resolve([]),
    loadKnowledgeDocuments(message, plan.maxDocs),
  ]);

  return {
    faqs: selectRelevantFaqs(faqs, message, plan.maxFaqs),
    policies,
    products,
    coupons,
    documents,
  };
}
