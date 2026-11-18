import { loadActiveCoupons } from "./loaders/LoadCoupons";
import { loadFaqs } from "./loaders/LoadFaqs";
import { loadKnowledgeDocuments } from "./loaders/LoadKnowledgeDocuments";
import { loadPolicies } from "./loaders/LoadPolicies";
import { loadRelevantProducts } from "./loaders/LoadProducts";
import type { AssistantKnowledgeContext } from "../types";

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
