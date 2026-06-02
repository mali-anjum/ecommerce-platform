import { loadActiveCoupons } from "./context/loadCoupons";
import { loadFaqs } from "./context/loadFaqs";
import { loadKnowledgeDocuments } from "./context/loadKnowledgeDocuments";
import { loadPolicies } from "./context/loadPolicies";
import { loadRelevantProducts } from "./context/loadProducts";
import type { AssistantKnowledgeContext } from "./types";

export async function loadAssistantKnowledgeContext(
  message: string,
  productId?: string,
): Promise<AssistantKnowledgeContext> {
  const [faqs, policies, products, coupons, documents] = await Promise.all([
    loadFaqs(),
    loadPolicies(),
    loadRelevantProducts(message, productId),
    loadActiveCoupons(),
    loadKnowledgeDocuments(),
  ]);

  return { faqs, policies, products, coupons, documents };
}
