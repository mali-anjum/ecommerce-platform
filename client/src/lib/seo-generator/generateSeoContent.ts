import {
  adminApi,
  AI_ADMIN_ROUTES,
  unwrapData,
} from "@/lib/api/adminApiClient";
import type { SeoContentResult, SeoGeneratorRequest } from "@/lib/seo-generator/types";

export async function generateSeoContent(
  payload: SeoGeneratorRequest,
): Promise<SeoContentResult> {
  const response = await adminApi.post(AI_ADMIN_ROUTES.seoGenerator, payload);
  return unwrapData<SeoContentResult>(response);
}
